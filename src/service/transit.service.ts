import {
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as dayjs from 'dayjs';

import { Distance } from '../distance/distance';
import { AddressDto } from '../dto/address.dto';
import { DriverPositionV2Dto } from '../dto/driver-position-v2.dto';
import { TransitDto } from '../dto/transit.dto';
import { Address } from '../entity/address.entity';
import { CarClass } from '../entity/car-type.entity';
import { DriverStatus } from '../entity/driver.entity';
import { Transit, TransitStatus } from '../entity/transit.entity';
import { AddressRepository } from '../repository/address.repository';
import { ClientRepository } from '../repository/client.repository';
import { DriverPositionRepository } from '../repository/driver-position.repository';
import { DriverSessionRepository } from '../repository/driver-session.repository';
import { DriverRepository } from '../repository/driver.repository';
import { TransitRepository } from '../repository/transit.repository';

import { AwardsService } from './awards.service';
import { CarTypeService } from './car-type.service';
import { DistanceCalculator } from './distance-calculator.service';
import { DriverFeeService } from './driver-fee.service';
import { DriverNotificationService } from './driver-notification.service';
import { GeocodingService } from './geocoding.service';
import { InvoiceGenerator } from './invoice-generator.service';

@Injectable()
export class TransitService {
  constructor(
    @InjectRepository(ClientRepository)
    private clientRepository: ClientRepository,
    @InjectRepository(TransitRepository)
    private transitRepository: TransitRepository,
    @InjectRepository(DriverRepository)
    private driverRepository: DriverRepository,
    @InjectRepository(DriverPositionRepository)
    private driverPositionRepository: DriverPositionRepository,
    @InjectRepository(DriverSessionRepository)
    private driverSessionRepository: DriverSessionRepository,
    @InjectRepository(AddressRepository)
    private addressRepository: AddressRepository,
    private awardsService: AwardsService,
    private driverFeeService: DriverFeeService,
    private carTypeService: CarTypeService,
    private geocodingService: GeocodingService,
    private invoiceGenerator: InvoiceGenerator,
    private distanceCalculator: DistanceCalculator,
    private notificationService: DriverNotificationService,
  ) {}

  public async createTransit(transitDto: TransitDto) {
    const from = await this.addressFromDto(transitDto.getFrom());
    const to = await this.addressFromDto(transitDto.getTo());

    if (!from || !to) {
      throw new NotAcceptableException(
        'Cannot create transit for empty address',
      );
    }

    return this._createTransit(
      transitDto.getClientDto().getId(),
      from,
      to,
      transitDto.getCarClass(),
    );
  }

  public async _createTransit(
    clientId: string,
    from: Address,
    to: Address,
    carClass: CarClass,
  ) {
    const client = await this.clientRepository.findOne(clientId);

    if (!client) {
      throw new NotFoundException('Client does not exist, id = ' + clientId);
    }

    // FIXME later: add some exceptions handling
    const geoFrom = this.geocodingService.geocodeAddress(from);
    const geoTo = this.geocodingService.geocodeAddress(to);

    const km = Distance.fromKm(
      this.distanceCalculator.calculateByMap(
        geoFrom[0],
        geoFrom[1],
        geoTo[0],
        geoTo[1],
      ),
    );

    const transit = Transit.create(from, to, client, carClass, Date.now(), km);

    transit.estimateCost();

    return this.transitRepository.save(transit);
  }

  public changeTransitAddressFrom(transitId: string, newAddress: AddressDto) {
    return this._changeTransitAddressFrom(
      transitId,
      newAddress.toAddressEntity(),
    );
  }

  private async _changeTransitAddressFrom(transitId: string, address: Address) {
    const newAddress = await this.addressRepository.save(address);
    const transit = await this.transitRepository.findOne(transitId);

    if (!transit) {
      throw new NotFoundException('Transit does not exist, id = ' + transitId);
    }

    if (!newAddress) {
      throw new NotAcceptableException('Cannot process without address');
    }

    // FIXME later: add some exceptions handling
    const geoFromNew = this.geocodingService.geocodeAddress(newAddress);
    const geoFromOld = this.geocodingService.geocodeAddress(transit.getFrom());

    // https://www.geeksforgeeks.org/program-distance-two-points-earth/
    // The math module contains a function
    // named toRadians which converts from
    // degrees to radians.
    const lon1 = DistanceCalculator.degreesToRadians(geoFromNew[1]);
    const lon2 = DistanceCalculator.degreesToRadians(geoFromOld[1]);
    const lat1 = DistanceCalculator.degreesToRadians(geoFromNew[0]);
    const lat2 = DistanceCalculator.degreesToRadians(geoFromOld[0]);

    // Haversine formula
    const dlon = lon2 - lon1;
    const dlat = lat2 - lat1;
    const a =
      Math.pow(Math.sin(dlat / 2), 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dlon / 2), 2);

    const c = 2 * Math.asin(Math.sqrt(a));

    // Radius of earth in kilometers. Use 3956 for miles
    const r = 6371;

    // calculate the result
    const distanceInKMeters = c * r;
    const newDistance = Distance.fromKm(
      this.distanceCalculator.calculateByMap(
        geoFromNew[0],
        geoFromNew[1],
        geoFromOld[0],
        geoFromOld[1],
      ),
    );

    transit.changePickupTo(newAddress, newDistance, distanceInKMeters);

    await this.transitRepository.save(transit);

    for (const driver of transit.getProposedDrivers()) {
      await this.notificationService.notifyAboutChangedTransitAddress(
        driver.getId(),
        transitId,
      );
    }
  }

  public async changeTransitAddressTo(
    transitId: string,
    newAddress: AddressDto,
  ) {
    const savedAddress = await this.addressRepository.save(
      newAddress.toAddressEntity(),
    );

    const transit = await this.transitRepository.findOne(transitId);

    if (!transit) {
      throw new NotFoundException('Transit does not exist, id = ' + transitId);
    }

    // FIXME later: add some exceptions handling
    const geoFrom = this.geocodingService.geocodeAddress(transit.getFrom());
    const geoTo = this.geocodingService.geocodeAddress(savedAddress);
    const newDistance = Distance.fromKm(
      this.distanceCalculator.calculateByMap(
        geoFrom[0],
        geoFrom[1],
        geoTo[0],
        geoTo[1],
      ),
    );

    transit.changeDestinationTo(savedAddress, newDistance);

    await this.transitRepository.save(transit);

    const driver = transit.getDriver();
    if (driver) {
      this.notificationService.notifyAboutChangedTransitAddress(
        driver.getId(),
        transitId,
      );
    }
  }

  public async cancelTransit(transitId: string) {
    const transit = await this.transitRepository.findOne(transitId);

    if (!transit) {
      throw new NotFoundException('Transit does not exist, id = ' + transitId);
    }

    const driver = transit.getDriver();

    if (driver) {
      this.notificationService.notifyAboutCancelledTransit(
        driver.getId(),
        transitId,
      );
    }

    transit.cancel();

    await this.transitRepository.save(transit);
  }

  public async publishTransit(transitId: string) {
    const transit = await this.transitRepository.findOne(transitId);

    if (!transit) {
      throw new NotFoundException('Transit does not exist, id = ' + transitId);
    }

    transit.publishAt(new Date());

    await this.transitRepository.save(transit);

    return this.findDriversForTransit(transitId);
  }

  public async findDriversForTransit(transitId: string) {
    const transit = await this.transitRepository.findOne(transitId);

    if (transit) {
      if (transit.getStatus() === TransitStatus.WAITING_FOR_DRIVER_ASSIGNMENT) {
        let distanceToCheck = 0;

        while (true) {
          if (transit.getAwaitingDriversResponses() > 4) {
            return transit;
          }

          distanceToCheck++;

          if (
            transit.shouldNotWaitForDriverAnymore() ||
            distanceToCheck >= 20
            // Should it be here? How is it even possible due to previous status check above loop?
          ) {
            transit.failDriverAssignment();

            await this.transitRepository.save(transit);
            return transit;
          }

          let geocoded: number[] = new Array(2);

          try {
            geocoded = this.geocodingService.geocodeAddress(transit.getFrom());
          } catch (e) {
            // Geocoding failed! Ask Jessica or Bryan for some help if needed.
          }

          const longitude = geocoded[1];
          const latitude = geocoded[0];

          //https://gis.stackexchange.com/questions/2951/algorithm-for-offsetting-a-latitude-longitude-by-some-amount-of-meters
          //Earth’s radius, sphere
          //double R = 6378;
          const R = 6371; // Changed to 6371 due to Copy&Paste pattern from different source

          //offsets in meters
          const dn = distanceToCheck;
          const de = distanceToCheck;

          //Coordinate offsets in radians
          const dLat = dn / R;
          const dLon = de / (R * Math.cos((Math.PI * latitude) / 180));

          //Offset positions, decimal degrees
          const latitudeMin = latitude - (dLat * 180) / Math.PI;
          const latitudeMax = latitude + (dLat * 180) / Math.PI;
          const longitudeMin = longitude - (dLon * 180) / Math.PI;
          const longitudeMax = longitude + (dLon * 180) / Math.PI;

          let driversAvgPositions =
            await this.driverPositionRepository.findAverageDriverPositionSince(
              latitudeMin,
              latitudeMax,
              longitudeMin,
              longitudeMax,
              dayjs().subtract(5, 'minutes').valueOf(),
            );

          if (driversAvgPositions.length) {
            const comparator = (
              d1: DriverPositionV2Dto,
              d2: DriverPositionV2Dto,
            ) => {
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

            const carClasses: CarClass[] = [];
            const activeCarClasses =
              await this.carTypeService.findActiveCarClasses();
            if (activeCarClasses.length === 0) {
              return transit;
            }
            if (transit.getCarType()) {
              if (activeCarClasses.includes(transit.getCarType())) {
                carClasses.push(transit.getCarType());
              } else {
                return transit;
              }
            } else {
              carClasses.push(...activeCarClasses);
            }

            const drivers = driversAvgPositions.map((item) => item.getDriver());

            const fetchedCars =
              await this.driverSessionRepository.findAllByLoggedOutAtNullAndDriverInAndCarClassIn(
                drivers,
                carClasses,
              );
            const activeDriverIdsInSpecificCar = fetchedCars.map((ds) =>
              ds.getDriver().getId(),
            );

            driversAvgPositions = driversAvgPositions.filter((dp) =>
              activeDriverIdsInSpecificCar.includes(dp.getDriver().getId()),
            );

            // Iterate across average driver positions
            for (const driverAvgPosition of driversAvgPositions) {
              const driver = driverAvgPosition.getDriver();
              if (
                driver.getStatus() === DriverStatus.ACTIVE &&
                !driver.getOccupied()
              ) {
                if (transit.canProposeTo(driver)) {
                  transit.proposeTo(driver);

                  await this.notificationService.notifyAboutPossibleTransit(
                    driver.getId(),
                    transitId,
                  );
                }
              } else {
                // Not implemented yet!
              }
            }

            await this.transitRepository.save(transit);
          } else {
            // Next iteration, no drivers at specified area
            continue;
          }
        }
      } else {
        throw new NotAcceptableException(
          'Wrong status for transit id = ' + transitId,
        );
      }
    } else {
      throw new NotFoundException('Transit does not exist, id = ' + transitId);
    }
  }

  public async acceptTransit(driverId: string, transitId: string) {
    const driver = await this.driverRepository.findOne(driverId);

    if (!driver) {
      throw new NotFoundException('Driver does not exist, id = ' + driverId);
    } else {
      const transit = await this.transitRepository.findOne(transitId);

      if (!transit) {
        throw new NotFoundException(
          'Transit does not exist, id = ' + transitId,
        );
      } else {
        transit.acceptBy(driver, new Date());

        await this.transitRepository.save(transit);
        await this.driverRepository.save(driver);
      }
    }
  }

  public async startTransit(driverId: string, transitId: string) {
    const driver = await this.driverRepository.findOne(driverId);

    if (!driver) {
      throw new NotFoundException('Driver does not exist, id = ' + driverId);
    }

    const transit = await this.transitRepository.findOne(transitId);

    if (!transit) {
      throw new NotFoundException('Transit does not exist, id = ' + transitId);
    }

    transit.start(new Date());

    await this.transitRepository.save(transit);
  }

  public async rejectTransit(driverId: string, transitId: string) {
    const driver = await this.driverRepository.findOne(driverId);

    if (!driver) {
      throw new NotFoundException('Driver does not exist, id = ' + driverId);
    }

    const transit = await this.transitRepository.findOne(transitId);

    if (!transit) {
      throw new NotFoundException('Transit does not exist, id = ' + transitId);
    }

    transit.rejectBy(driver);

    await this.transitRepository.save(transit);
  }

  public completeTransitFromDto(
    driverId: string,
    transitId: string,
    destinationAddress: AddressDto,
  ) {
    return this.completeTransit(
      driverId,
      transitId,
      destinationAddress.toAddressEntity(),
    );
  }

  public async completeTransit(
    driverId: string,
    transitId: string,
    destinationAddress: Address,
  ) {
    const destination = await this.addressRepository.save(destinationAddress);

    const driver = await this.driverRepository.findOne(driverId);

    if (!driver) {
      throw new NotFoundException('Driver does not exist, id = ' + driverId);
    }

    const transit = await this.transitRepository.findOne(transitId);

    if (!transit) {
      throw new NotFoundException('Transit does not exist, id = ' + transitId);
    }

    const geoFrom = this.geocodingService.geocodeAddress(transit.getFrom());
    const geoTo = this.geocodingService.geocodeAddress(transit.getTo());
    const distance = Distance.fromKm(
      this.distanceCalculator.calculateByMap(
        geoFrom[0],
        geoFrom[1],
        geoTo[0],
        geoTo[1],
      ),
    );

    transit.completeTransitAt(new Date(), destination, distance);

    const driverFee = await this.driverFeeService.calculateDriverFee(
      transit.getId(),
    );

    transit.setDriversFee(driverFee);
    driver.setOccupied(false);

    await this.driverRepository.save(driver);

    await this.awardsService.registerMiles(
      transit.getClient().getId(),
      transitId,
    );

    await this.transitRepository.save(transit);

    await this.invoiceGenerator.generate(
      transit.getPrice()?.toInt() ?? 0,
      transit.getClient().getName() + ' ' + transit.getClient().getLastName(),
    );
  }

  public async loadTransit(transitId: string) {
    const transit = await this.transitRepository.findOne(transitId);

    if (!transit) {
      throw new NotFoundException('Transit does not exist, id = ' + transitId);
    }

    return new TransitDto(transit);
  }

  private async addressFromDto(addressDTO: AddressDto) {
    const address = addressDTO.toAddressEntity();
    return this.addressRepository.save(address);
  }
}
