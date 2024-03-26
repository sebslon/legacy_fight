import {
  Injectable,
  Logger,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';

import { CarClass } from '../car-fleet/car-class.enum';
import { CarTypeService } from '../car-fleet/car-type.service';
import { Clock } from '../common/clock';
import { ClientRepository } from '../crm/client.repository';
import { TransitCompletedEvent } from '../crm/transit-analyzer/events/transit-completed.event';
import { DriverFeeService } from '../driver-fleet/driver-fee.service';
import { DriverRepository } from '../driver-fleet/driver.repository';
import { DriverService } from '../driver-fleet/driver.service';
import { TransitDTO } from '../dto/transit.dto';
import { NoFurtherThan } from '../entity/transit/rules/no-further-than.rule';
import { NotPublished } from '../entity/transit/rules/not-published.rule';
import { OrRule } from '../entity/transit/rules/or-rule';
import { Transit, TransitStatus } from '../entity/transit/transit.entity';
import { AddressDTO } from '../geolocation/address/address.dto';
import { Address } from '../geolocation/address/address.entity';
import { AddressRepository } from '../geolocation/address/address.repository';
import { Distance } from '../geolocation/distance';
import { DistanceCalculator } from '../geolocation/distance-calculator.service';
import { GeocodingService } from '../geolocation/geocoding.service';
import { InvoiceGenerator } from '../invoicing/invoice-generator.service';
import { AwardsService } from '../loyalty/awards.service';
import { Money } from '../money/money';
import { DriverNotificationService } from '../notification/driver-notification.service';
import { TransitRepository } from '../repository/transit.repository';
import { DriverPositionRepository } from '../tracking/driver-position.repository';
import { DriverSessionRepository } from '../tracking/driver-session.repository';
import { DriverTrackingService } from '../tracking/driver-tracking.service';
import { TransitDetailsFacade } from '../transit-details/transit-details.facade';

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
    private eventEmitter: EventEmitter2,
    private transitDetailsFacade: TransitDetailsFacade,
    private readonly driverService: DriverService,
    private readonly driverTrackingService: DriverTrackingService,
  ) {}

  public async createTransitFromDTO(transitDto: TransitDTO) {
    const from = await this.addressFromDto(transitDto.getFrom());
    const to = await this.addressFromDto(transitDto.getTo());

    if (!from || !to) {
      throw new NotAcceptableException(
        'Cannot create transit for empty address',
      );
    }

    return this.createTransit(
      transitDto.getClientDto().getId(),
      from,
      to,
      transitDto.getCarClass(),
    );
  }

  public async createTransit(
    clientId: string,
    from: Address,
    to: Address,
    carClass: CarClass,
  ) {
    const now = Clock.currentDate();
    const client = await this.clientRepository.findOne(clientId);

    const addressFrom = await this.addressRepository.getOrCreate(from);
    const addressTo = await this.addressRepository.getOrCreate(to);

    if (!client) {
      throw new NotFoundException('Client does not exist, id = ' + clientId);
    }

    // FIXME later: add some exceptions handling
    const geoFrom = this.geocodingService.geocodeAddress(addressFrom);
    const geoTo = this.geocodingService.geocodeAddress(addressTo);

    const km = Distance.fromKm(
      this.distanceCalculator.calculateByMap(
        geoFrom[0],
        geoFrom[1],
        geoTo[0],
        geoTo[1],
      ),
    );

    let transit = Transit.create(now, km);
    const estimatedPrice = transit.estimateCost();

    transit = await this.transitRepository.save(transit);

    await this.transitDetailsFacade.transitRequested(
      now,
      transit.getId(),
      addressFrom,
      addressTo,
      km,
      client,
      carClass,
      estimatedPrice,
      transit.getTariff(),
    );

    return this.loadTransit(transit.getId());
  }

  public changeTransitAddressFrom(transitId: string, newAddress: AddressDTO) {
    return this._changeTransitAddressFrom(
      transitId,
      newAddress.toAddressEntity(),
    );
  }

  private async _changeTransitAddressFrom(transitId: string, address: Address) {
    const newAddress = await this.addressRepository.save(address);
    const transit = await this.transitRepository.findOne(transitId);
    const transitDetails = await this.findTransitDetails(transitId);

    if (!transit) {
      throw new NotFoundException('Transit does not exist, id = ' + transitId);
    }

    if (!newAddress) {
      throw new NotAcceptableException('Cannot process without address');
    }

    // FIXME later: add some exceptions handling
    const { newDistance, distanceInKMeters } =
      this.calculateDistanceBetweenAddresses(
        newAddress,
        transitDetails.from.toAddressEntity(),
      );

    transit.changePickupTo(newAddress, newDistance, distanceInKMeters);

    await this.transitRepository.save(transit);
    await this.transitDetailsFacade.pickupChangedTo(
      transit.getId(),
      newAddress,
      newDistance,
    );

    for (const driverId of transit.getProposedDrivers()) {
      await this.notificationService.notifyAboutChangedTransitAddress(
        driverId,
        transitId,
      );
    }
  }

  public async changeTransitAddressTo(
    transitId: string,
    newAddress: AddressDTO,
  ) {
    const savedAddress = await this.addressRepository.save(
      newAddress.toAddressEntity(),
    );

    const transit = await this.transitRepository.findOne(transitId);

    if (!transit) {
      throw new NotFoundException('Transit does not exist, id = ' + transitId);
    }

    const transitDetails = await this.findTransitDetails(transitId);

    // FIXME later: add some exceptions handling
    const geoFrom = this.geocodingService.geocodeAddress(
      transitDetails.from.toAddressEntity(),
    );
    const geoTo = this.geocodingService.geocodeAddress(savedAddress);
    const newDistance = Distance.fromKm(
      this.distanceCalculator.calculateByMap(
        geoFrom[0],
        geoFrom[1],
        geoTo[0],
        geoTo[1],
      ),
    );

    // Change of destination is allowed when
    // 1. Transit is not published - no limit on distance
    // 2. Waiting for driver - to 5km from original destination
    // 3. In progress - to 1km from original destination
    const rules = new OrRule([
      new NotPublished(),
      new NoFurtherThan(TransitStatus.IN_TRANSIT, Distance.fromKm(5)),
      new NoFurtherThan(TransitStatus.IN_TRANSIT, Distance.fromKm(1)),
    ]);

    transit.changeDestinationTo(savedAddress, newDistance, rules);

    await this.transitRepository.save(transit);
    await this.transitDetailsFacade.destinationChanged(
      transit.getId(),
      savedAddress,
      newDistance,
    );

    const driverId = transit.getDriverId();

    if (driverId) {
      this.notificationService.notifyAboutChangedTransitAddress(
        driverId,
        transitId,
      );
    }
  }

  public async cancelTransit(transitId: string) {
    const transit = await this.transitRepository.findOne(transitId);

    if (!transit) {
      throw new NotFoundException('Transit does not exist, id = ' + transitId);
    }

    const driverId = transit.getDriverId();

    if (driverId) {
      this.notificationService.notifyAboutCancelledTransit(driverId, transitId);
    }

    transit.cancel();

    await this.transitRepository.save(transit);
    await this.transitDetailsFacade.transitCancelled(transitId);
  }

  public async publishTransit(transitId: string) {
    const now = Clock.currentDate();
    const transit = await this.transitRepository.findOne(transitId);

    if (!transit) {
      throw new NotFoundException('Transit does not exist, id = ' + transitId);
    }

    transit.publishAt(now);

    await this.transitRepository.save(transit);
    await this.transitDetailsFacade.transitPublished(transitId, now);

    return this.findDriversForTransit(transitId);
  }

  public async findDriversForTransit(transitId: string) {
    const transit = await this.transitRepository.findOne(transitId);

    if (!transit) {
      throw new NotFoundException('Transit does not exist, id = ' + transitId);
    }

    const transitDetails = await this.findTransitDetails(transitId);

    if (transit.getStatus() !== TransitStatus.WAITING_FOR_DRIVER_ASSIGNMENT) {
      throw new NotAcceptableException(
        'Wrong status for transit id = ' + transitId,
      );
    }

    let distanceToCheck = 0;

    while (true) {
      if (transit.getAwaitingDriversResponses() > 4) {
        return transit;
      }

      distanceToCheck++;

      if (
        transit.shouldNotWaitForDriverAnymore(Clock.currentDate()) ||
        distanceToCheck >= 20
      ) {
        transit.failDriverAssignment();

        await this.transitRepository.save(transit);
        return transit;
      }

      let geocoded: number[] = new Array(2);

      try {
        geocoded = this.geocodingService.geocodeAddress(
          transitDetails.from.toAddressEntity(),
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

      const carClasses: CarClass[] = await this.choosePossibleCarClasses(
        transitDetails.carType,
      );

      if (carClasses.length === 0) {
        return transit;
      }

      const driversAvgPositions =
        await this.driverTrackingService.findActiveDriversNearby(
          latitudeMin,
          latitudeMax,
          longitudeMin,
          longitudeMax,
          latitude,
          longitude,
          carClasses,
        );

      if (driversAvgPositions.length === 0) {
        continue;
      }

      for (const position of driversAvgPositions) {
        if (transit.canProposeTo(position.getDriverId())) {
          transit.proposeTo(position.getDriverId());
          this.notificationService.notifyAboutPossibleTransit(
            position.getDriverId(),
            transitId,
          );
        }
      }
    }
  }

  public async acceptTransit(driverId: string, transitId: string) {
    const driver = await this.driverRepository.findOne(driverId);

    if (!driver) {
      throw new NotFoundException('Driver does not exist, id = ' + driverId);
    }

    const transit = await this.transitRepository.findOne(transitId);

    if (!transit) {
      throw new NotFoundException('Transit does not exist, id = ' + transitId);
    }

    const now = Clock.currentDate();

    transit.acceptBy(driverId);
    driver.setOccupied(true);

    await this.driverRepository.save(driver);
    await this.transitRepository.save(transit);
    await this.transitDetailsFacade.transitAccepted(transitId, now, driver);
  }

  public async startTransit(driverId: string, transitId: string) {
    const now = Clock.currentDate();
    const driver = await this.driverRepository.findOne(driverId);

    if (!driver) {
      throw new NotFoundException('Driver does not exist, id = ' + driverId);
    }

    const transit = await this.transitRepository.findOne(transitId);

    if (!transit) {
      throw new NotFoundException('Transit does not exist, id = ' + transitId);
    }

    transit.start();

    await this.transitRepository.save(transit);
    await this.transitDetailsFacade.transitStarted(transitId, now);
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

    transit.rejectBy(driverId);

    await this.transitRepository.save(transit);
  }

  public completeTransitFromDto(driverId: string, transitId: string) {
    return this.completeTransit(driverId, transitId);
  }

  public async completeTransit(driverId: string, transitId: string) {
    const now = Clock.currentDate();

    const driver = await this.driverRepository.findOne(driverId);

    if (!driver) {
      throw new NotFoundException('Driver does not exist, id = ' + driverId);
    }

    const transit = await this.transitRepository.findOne(transitId);

    if (!transit) {
      throw new NotFoundException('Transit does not exist, id = ' + transitId);
    }

    const transitDetails = await this.findTransitDetails(transitId);

    const fromAddress = await this.addressRepository.findByHashOrFail(
      transitDetails.from.getHash(),
    );
    const toAddress = await this.addressRepository.findByHashOrFail(
      transitDetails.to.getHash(),
    );

    const geoFrom = this.geocodingService.geocodeAddress(fromAddress);
    const geoTo = this.geocodingService.geocodeAddress(toAddress);
    const distance = Distance.fromKm(
      this.distanceCalculator.calculateByMap(
        geoFrom[0],
        geoFrom[1],
        geoTo[0],
        geoTo[1],
      ),
    );

    transit.completeTransitAt(distance);

    const driverFee = await this.driverFeeService.calculateDriverFee(
      transit.getPrice() as Money,
      driverId,
    );

    driver.setOccupied(false);

    await this.driverRepository.save(driver);

    await this.awardsService.registerMiles(
      transitDetails.client.getId(),
      transitId,
    );

    await this.transitRepository.save(transit);

    await this.transitDetailsFacade.transitCompleted(
      transitId,
      now,
      transit.getPrice() as Money,
      driverFee,
    );

    await this.invoiceGenerator.generate(
      transit.getPrice()?.toInt() ?? 0,
      transitDetails.client.getName() +
        ' ' +
        transitDetails.client.getLastName(),
    );

    const transitCompletedEvent = new TransitCompletedEvent(
      transitDetails.client.getId(),
      transitId,
      transitDetails.from.getHash(),
      transitDetails.to.getHash(),
      transitDetails.started ? new Date(+transitDetails.started) : new Date(),
      now,
    );

    this.eventEmitter.emit('transit.completed', transitCompletedEvent);
  }

  public async loadTransit(transitId: string) {
    const transitDetails = await this.findTransitDetails(transitId);
    const transit = await this.transitRepository.findOneOrFail(transitId);

    const proposedDrivers = await this.driverService.loadDrivers(
      transit.getProposedDrivers(),
    );
    const driverRejections = await this.driverService.loadDrivers(
      transit.getDriversRejections(),
    );

    return new TransitDTO(
      transitDetails,
      proposedDrivers,
      driverRejections,
      transit.getDriverId(),
    );
  }

  private async choosePossibleCarClasses(carClass: CarClass) {
    const carClasses: CarClass[] = [];
    const activeCarClasses = await this.carTypeService.findActiveCarClasses();

    if (carClass) {
      if (activeCarClasses.includes(carClass)) {
        carClasses.push(carClass);
      }
    } else {
      carClasses.push(...activeCarClasses);
    }

    return carClasses;
  }

  private calculateDistanceBetweenAddresses(
    newAddress: Address,
    oldAddress: Address,
  ) {
    const geoFromNew = this.geocodingService.geocodeAddress(newAddress);
    const geoFromOld = this.geocodingService.geocodeAddress(oldAddress);

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
    return { newDistance, distanceInKMeters };
  }

  private async addressFromDto(addressDTO: AddressDTO) {
    const address = addressDTO.toAddressEntity();
    return this.addressRepository.save(address);
  }

  private findTransitDetails(transitId: string) {
    return this.transitDetailsFacade.find(transitId);
  }
}
