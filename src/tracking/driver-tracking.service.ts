import {
  Injectable,
  NotFoundException,
  NotAcceptableException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CarClass } from '../car-fleet/car-class.enum';
import { Clock } from '../common/clock';
import { TravelledDistanceService } from '../driver-fleet/driver-report/travelled-distance/travelled-distance.service';
import { DriverStatus } from '../driver-fleet/driver.entity';
import { DriverRepository } from '../driver-fleet/driver.repository';
import { DriverService } from '../driver-fleet/driver.service';
import { AddressDTO } from '../geolocation/address/address.dto';
import { Distance } from '../geolocation/distance';
import { GeocodingService } from '../geolocation/geocoding.service';

import { DriverPositionV2DTO } from './driver-position-v2.dto';
import { DriverPosition } from './driver-position.entity';
import { DriverPositionRepository } from './driver-position.repository';
import { DriverSessionService } from './driver-session.service';

@Injectable()
export class DriverTrackingService {
  constructor(
    @InjectRepository(DriverRepository)
    private driverRepository: DriverRepository,
    @InjectRepository(DriverPositionRepository)
    private positionRepository: DriverPositionRepository,
    private travelledDistanceService: TravelledDistanceService,
    private readonly driverSessionService: DriverSessionService,
    private readonly driverService: DriverService,
    private readonly geocodingService: GeocodingService,
  ) {}

  public async registerPosition(
    driverId: string,
    latitude: number,
    longitude: number,
    seenAt: Date,
  ): Promise<DriverPosition> {
    const driver = await this.driverRepository.findOne(driverId);

    if (!driver) {
      throw new NotFoundException('Driver does not exists, id = ' + driverId);
    }

    if (driver.getStatus() !== DriverStatus.ACTIVE) {
      throw new NotAcceptableException(
        'Driver is not active, cannot register position, id = ' + driverId,
      );
    }

    let position = new DriverPosition(
      driverId,
      seenAt.getTime(),
      latitude,
      longitude,
    );

    position = await this.positionRepository.save(position);

    await this.travelledDistanceService.addPosition(
      driverId,
      latitude,
      longitude,
      seenAt,
    );

    return position;
  }

  public async calculateTravelledDistance(
    driverId: string,
    from: number,
    to: number,
  ): Promise<Distance> {
    const driver = await this.driverRepository.findOne(driverId);

    if (!driver) {
      throw new NotFoundException('Driver does not exists, id = ' + driverId);
    }

    return this.travelledDistanceService.calculateDistance(
      driverId,
      new Date(from),
      new Date(to),
    );
  }

  public async findActiveDriversNearby(
    address: AddressDTO,
    distance: Distance,
    carClasses: CarClass[],
  ): Promise<DriverPositionV2DTO[]> {
    let geocoded: number[] = new Array(2);

    try {
      geocoded = this.geocodingService.geocodeAddress(
        address.toAddressEntity(),
      );
    } catch (e) {
      Logger.error('Geocoding failed while finding drivers for transit.');
      // Geocoding failed! Ask Jessica or Bryan for some help if needed.
    }

    const [latitude, longitude] = geocoded;
    //https://gis.stackexchange.com/questions/2951/algorithm-for-offsetting-a-latitude-longitude-by-some-amount-of-meters
    //Earth’s radius, sphere
    //double R = 6378;
    const R = 6371; // Changed to 6371 due to Copy&Paste pattern from different source

    //offsets in meters
    const dn = distance.toKmInFloat();
    const de = distance.toKmInFloat();

    //Coordinate offsets in radians
    const dLat = dn / R;
    const dLon = de / (R * Math.cos((Math.PI * latitude) / 180));

    //Offset positions, decimal degrees
    const latitudeMin = latitude - (dLat * 180) / Math.PI;
    const latitudeMax = latitude + (dLat * 180) / Math.PI;
    const longitudeMin = longitude - (dLon * 180) / Math.PI;
    const longitudeMax = longitude + (dLon * 180) / Math.PI;

    const fiveMinutesOffset = 5 * 60 * 1000;

    let driversAvgPositions =
      await this.positionRepository.findAverageDriverPositionSince(
        latitudeMin,
        latitudeMax,
        longitudeMin,
        longitudeMax,
        Clock.currentDate().getTime() - fiveMinutesOffset,
      );

    const comparator = (d1: DriverPositionV2DTO, d2: DriverPositionV2DTO) => {
      const a = Math.sqrt(
        Math.pow(latitude - d1.getLatitude(), 2) +
          Math.pow(longitude - d1.getLongitude(), 2),
      );
      const b = Math.sqrt(
        Math.pow(latitude - d2.getLatitude(), 2) +
          Math.pow(longitude - d2.getLongitude(), 2),
      );
      if (a < b) {
        return -1;
      }
      if (a > b) {
        return 1;
      }
      return 0;
    };
    driversAvgPositions.sort(comparator);

    driversAvgPositions = driversAvgPositions.slice(0, 20);

    const driversIds: string[] = driversAvgPositions.map((pos) =>
      pos.getDriverId(),
    );

    const activeDriverIdsInSpecificCar =
      await this.driverSessionService.findCurrentlyLoggedDriverIds(
        driversIds,
        carClasses,
      );

    driversAvgPositions = driversAvgPositions.filter((dp) =>
      activeDriverIdsInSpecificCar.includes(dp.getDriverId()),
    );

    const drivers = await this.driverService.loadDrivers(driversIds);

    driversAvgPositions = driversAvgPositions.filter((dp) => {
      const driver = drivers.find((d) => d.getId() === dp.getDriverId());
      return (
        driver &&
        driver.getStatus() === DriverStatus.ACTIVE &&
        !driver.getIsOccupied()
      );
    });

    return driversAvgPositions;
  }
}
