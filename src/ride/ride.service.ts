import {
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';

import { DriverAssignmentFacade } from '../assignment/driver-assignment.facade';
import { CarClass } from '../car-fleet/car-class.enum';
import { Clock } from '../common/clock';
import { ClientRepository } from '../crm/client.repository';
import { DriverFeeService } from '../driver-fleet/driver-fee.service';
import { DriverRepository } from '../driver-fleet/driver.repository';
import { DriverService } from '../driver-fleet/driver.service';
import { AddressDTO } from '../geolocation/address/address.dto';
import { Address } from '../geolocation/address/address.entity';
import { AddressRepository } from '../geolocation/address/address.repository';
import { Distance } from '../geolocation/distance';
import { DistanceCalculator } from '../geolocation/distance-calculator.service';
import { GeocodingService } from '../geolocation/geocoding.service';
import { InvoiceGenerator } from '../invoicing/invoice-generator.service';
import { AwardsService } from '../loyalty/awards.service';
import { Tariffs } from '../pricing/tariffs';

import { TransitCompletedEvent } from './events/transit-completed.event';
import { RequestForTransitRepository } from './request-for-transit.repository';
import { RequestTransitService } from './request-transit.service';
import { NoFurtherThan } from './rules/no-further-than.rule';
import { NotPublished } from './rules/not-published.rule';
import { OrRule } from './rules/or-rule';
import { TransitDemand } from './transit-demand.entity';
import { TransitDemandRepository } from './transit-demand.repository';
import { TransitDetailsFacade } from './transit-details/transit-details.facade';
import { TransitDTO } from './transit.dto';
import { Transit, TransitStatus } from './transit.entity';
import { TransitRepository } from './transit.repository';

@Injectable()
export class RideService {
  constructor(
    @InjectRepository(ClientRepository)
    private readonly clientRepository: ClientRepository,
    @InjectRepository(TransitRepository)
    private readonly transitRepository: TransitRepository,
    @InjectRepository(DriverRepository)
    private readonly driverRepository: DriverRepository,
    @InjectRepository(AddressRepository)
    private readonly addressRepository: AddressRepository,
    @InjectRepository(RequestForTransitRepository)
    private readonly requestForTransitRepository: RequestForTransitRepository,
    @InjectRepository(TransitDemandRepository)
    private readonly transitDemandRepository: TransitDemandRepository,
    private readonly awardsService: AwardsService,
    private readonly driverFeeService: DriverFeeService,
    private readonly geocodingService: GeocodingService,
    private readonly invoiceGenerator: InvoiceGenerator,
    private readonly distanceCalculator: DistanceCalculator,
    private readonly eventEmitter: EventEmitter2,
    private readonly transitDetailsFacade: TransitDetailsFacade,
    private readonly driverService: DriverService,
    private readonly requestTransitService: RequestTransitService,
    private readonly tariffs: Tariffs,
    private readonly driverAssignmentFacade: DriverAssignmentFacade,
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

    const client = await this.findClient(clientId);
    const addressFrom = await this.addressRepository.getOrCreate(from);
    const addressTo = await this.addressRepository.getOrCreate(to);

    const requestForTransit =
      await this.requestTransitService.createRequestForTransit(from, to);

    await this.transitDetailsFacade.transitRequested(
      now,
      requestForTransit.getRequestUUID(),
      addressFrom,
      addressTo,
      requestForTransit.getDistance(),
      client,
      carClass,
      requestForTransit.getEstimatedPrice(),
      requestForTransit.getTariff(),
    );

    return this.loadTransit(requestForTransit.getRequestUUID());
  }

  public async changeTransitAddressFrom(requestUUID: string, address: Address) {
    const newAddress = await this.addressRepository.save(address);
    const transitDemand =
      await this.transitDemandRepository.findByTransitRequestUUID(requestUUID);

    if (!transitDemand) {
      throw new NotFoundException(
        `Transit demand does not exist, id = ${requestUUID}`,
      );
    }

    if (await this.driverAssignmentFacade.isDriverAssigned(requestUUID)) {
      throw new NotAcceptableException(
        `Driver is already assigned to transit with id = ${requestUUID}`,
      );
    }

    const transitDetails = await this.findTransitDetails(requestUUID);

    const { newDistance, distanceInKMeters } =
      this.calculateDistanceBetweenAddresses(
        newAddress,
        transitDetails.from.toAddressEntity(),
      );

    transitDemand.changePickup(distanceInKMeters);

    await this.transitDemandRepository.save(transitDemand);
    await this.transitDetailsFacade.pickupChangedTo(
      requestUUID,
      newAddress,
      newDistance,
    );
    await this.driverAssignmentFacade.notifyProposedDriversAboutChangedDestination(
      requestUUID,
    );
  }

  public async changeTransitAddressTo(
    requestUUID: string,
    newAddress: AddressDTO,
  ) {
    const savedAddress = await this.addressRepository.save(
      newAddress.toAddressEntity(),
    );

    const requestForTransit =
      await this.requestForTransitRepository.findByRequestUUID(requestUUID);
    const transitDetails = await this.transitDetailsFacade.findByRequestUUID(
      requestUUID,
    );

    if (!requestForTransit) {
      throw new NotFoundException(
        `Transit request does not exist, id = ${requestUUID}`,
      );
    }

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

    const transit = await this.transitRepository.findByTransitRequestUUID(
      requestUUID,
    );

    if (transit) {
      transit.changeDestinationTo(newDistance, rules);
      await this.transitRepository.save(transit);
    }

    await this.driverAssignmentFacade.notifyAssignedDriverAboutChangedDestination(
      requestUUID,
    );
    await this.transitDetailsFacade.destinationChanged(
      requestUUID,
      savedAddress,
    );
  }

  public async cancelTransit(requestUUID: string) {
    const transit = await this.requestForTransitRepository.findByRequestUUID(
      requestUUID,
    );

    if (!transit) {
      throw new NotFoundException(
        'Transit does not exist, id = ' + requestUUID,
      );
    }

    const transitDemand =
      await this.transitDemandRepository.findByTransitRequestUUID(requestUUID);

    if (transitDemand) {
      transitDemand.cancel();
      await this.transitDemandRepository.save(transitDemand);

      await this.driverAssignmentFacade.cancel(requestUUID);
    }

    await this.transitDetailsFacade.transitCancelled(requestUUID);
  }

  public async publishTransit(requestUUID: string) {
    const now = Clock.currentDate();

    const requestFor = await this.requestForTransitRepository.findByRequestUUID(
      requestUUID,
    );
    const transitDetailsDto = await this.transitDetailsFacade.findByRequestUUID(
      requestUUID,
    );

    if (!requestFor) {
      throw new NotFoundException(
        'Transit does not exist, id = ' + requestUUID,
      );
    }

    await this.transitDemandRepository.save(
      new TransitDemand(requestFor.getRequestUUID()),
    );

    await this.driverAssignmentFacade.createAssignment(
      requestUUID,
      transitDetailsDto.from,
      transitDetailsDto.carType,
      now,
    );

    await this.transitDetailsFacade.transitPublished(requestUUID, now);

    return this.transitRepository.findByTransitRequestUUID(requestUUID);
  }

  public async findDriversForTransit(requestUUID: string) {
    const transitDetailsDTO = await this.transitDetailsFacade.findByRequestUUID(
      requestUUID,
    );
    const involvedDriversSummary =
      await this.driverAssignmentFacade.searchForPossibleDrivers(
        requestUUID,
        transitDetailsDTO.from,
        transitDetailsDTO.carType,
      );
    await this.transitDetailsFacade.driversAreInvolved(
      requestUUID,
      involvedDriversSummary,
    );

    return this.transitRepository.findByTransitRequestUUID(requestUUID);
  }

  public async acceptTransit(driverId: string, requestUUID: string) {
    const driver = await this.driverRepository.findOne(driverId);

    if (!driver) {
      throw new NotFoundException('Driver does not exist, id = ' + driverId);
    }

    const transitDemand =
      await this.transitDemandRepository.findByTransitRequestUUID(requestUUID);

    if (!transitDemand) {
      throw new NotFoundException(
        'Transit does not exist, id = ' + requestUUID,
      );
    }

    if (await this.driverAssignmentFacade.isDriverAssigned(requestUUID)) {
      throw new NotAcceptableException(
        'Driver is already assigned to transit with id = ' + requestUUID,
      );
    }

    const now = Clock.currentDate();

    transitDemand.accepted();

    await this.driverAssignmentFacade.acceptTransit(requestUUID, driver);
    await this.transitDetailsFacade.transitAccepted(requestUUID, now, driver);

    await this.transitDemandRepository.save(transitDemand);
    await this.driverRepository.save(driver);
  }

  public async startTransit(driverId: string, requestUUID: string) {
    const now = Clock.currentDate();
    const driver = await this.driverRepository.findOne(driverId);

    if (!driver) {
      throw new NotFoundException('Driver does not exist, id = ' + driverId);
    }

    const transitDemand =
      await this.transitDemandRepository.findByTransitRequestUUID(requestUUID);

    if (!transitDemand) {
      throw new NotFoundException(
        'Transit does not exist, id = ' + requestUUID,
      );
    }

    if (!(await this.driverAssignmentFacade.isDriverAssigned(requestUUID))) {
      throw new NotAcceptableException(
        'Driver is not assigned to transit with id = ' + requestUUID,
      );
    }
    const transit = new Transit(
      TransitStatus.IN_TRANSIT,
      this.tariffs.choose(now),
      requestUUID,
    );

    await this.transitRepository.save(transit);
    await this.transitDetailsFacade.transitStarted(
      requestUUID,
      transit.getId(),
      now,
    );
  }

  public async rejectTransit(driverId: string, requestUUID: string) {
    const driver = await this.driverRepository.findOne(driverId);

    if (!driver) {
      throw new NotFoundException('Driver does not exist, id = ' + driverId);
    }

    await this.driverAssignmentFacade.rejectTransit(requestUUID, driverId);
  }

  public completeTransitFromDto(
    driverId: string,
    transitId: string,
    destinationAddress: AddressDTO,
  ) {
    return this.completeTransit(
      driverId,
      transitId,
      destinationAddress.toAddressEntity(),
    );
  }

  public async completeTransit(
    driverId: string,
    requestUUID: string,
    destinationAddress: Address,
  ) {
    const now = Clock.currentDate();
    const destination = await this.addressRepository.save(destinationAddress);

    const driver = await this.driverRepository.findOne(driverId);
    const transitDetails = await this.transitDetailsFacade.findByRequestUUID(
      requestUUID,
    );

    if (!driver) {
      throw new NotFoundException('Driver does not exist, id = ' + driverId);
    }

    const transit = await this.transitRepository.findByTransitRequestUUID(
      requestUUID,
    );

    if (!transit) {
      throw new NotFoundException(
        'Transit does not exist, id = ' + requestUUID,
      );
    }

    const fromAddress = await this.addressRepository.findByHashOrFail(
      transitDetails.from.getHash(),
    );
    const toAddress = await this.addressRepository.findByHashOrFail(
      destination.getHash(),
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

    const finalPrice = transit.completeTransitAt(distance);
    const driverFee = await this.driverFeeService.calculateDriverFee(
      finalPrice,
      driverId,
    );

    driver.setOccupied(false);
    await this.driverRepository.save(driver);

    await this.awardsService.registerMiles(
      transitDetails.client.getId(),
      requestUUID,
    );
    await this.transitRepository.save(transit);
    await this.transitDetailsFacade.transitCompleted(
      requestUUID,
      now,
      finalPrice,
      driverFee,
    );

    await this.invoiceGenerator.generate(
      finalPrice.toInt(),
      transitDetails.client.getName() +
        ' ' +
        transitDetails.client.getLastName(),
    );

    const transitCompletedEvent = new TransitCompletedEvent(
      transitDetails.client.getId(),
      requestUUID,
      transitDetails.from.getHash(),
      transitDetails.to.getHash(),
      transitDetails.started ? new Date(+transitDetails.started) : new Date(),
      now,
    );

    this.eventEmitter.emit('transit.completed', transitCompletedEvent);
  }

  public async loadTransit(requestUUID: string) {
    const involvedDriversSummary =
      await this.driverAssignmentFacade.loadInvolvedDrivers(requestUUID);
    const transitDetails = await this.transitDetailsFacade.findByRequestUUID(
      requestUUID,
    );

    const proposedDrivers = await this.driverService.loadDrivers(
      involvedDriversSummary.proposedDrivers,
    );
    const driverRejections = await this.driverService.loadDrivers(
      involvedDriversSummary.driversRejections,
    );

    return new TransitDTO(
      transitDetails,
      proposedDrivers,
      driverRejections,
      involvedDriversSummary.assignedDriver,
    );
  }

  private async findClient(clientId: string) {
    const client = await this.clientRepository.findOne(clientId);

    if (!client) {
      throw new NotFoundException('Client does not exist, id = ' + clientId);
    }

    return client;
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

  private findTransitDetails(requestUUID: string) {
    return this.transitDetailsFacade.findByRequestUUID(requestUUID);
  }
}
