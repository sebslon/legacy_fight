import {
  Injectable,
  NotFoundException,
  NotAcceptableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CarClass } from '../car-fleet/car-class.enum';
import { Clock } from '../common/clock';
import { TravelledDistanceService } from '../driver-fleet/driver-report/travelled-distance/travelled-distance.service';
import { DriverStatus } from '../driver-fleet/driver.entity';
import { DriverRepository } from '../driver-fleet/driver.repository';
import { DriverService } from '../driver-fleet/driver.service';
import { Distance } from '../geolocation/distance';

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
    latitudeMin: number,
    latitudeMax: number,
    longitudeMin: number,
    longitudeMax: number,
    latitude: number,
    longitude: number,
    carClasses: CarClass[],
  ): Promise<DriverPositionV2DTO[]> {
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
