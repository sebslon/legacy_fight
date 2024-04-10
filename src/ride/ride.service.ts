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
import { DistanceCalculator } from '../geolocation/distance-calculator.service';
import { GeocodingService } from '../geolocation/geocoding.service';
import { InvoiceGenerator } from '../invoicing/invoice-generator.service';
import { AwardsService } from '../loyalty/awards.service';

import { ChangeDestinationService } from './change-destination.service';
import { ChangePickupService } from './change-pickup.service';
import { CompleteTransitService } from './complete-transit.service';
import { DemandService } from './demand.service';
import { TransitCompletedEvent } from './events/transit-completed.event';
import { RequestTransitService } from './request-transit.service';
import { StartTransitService } from './start-transit.service';
import { TransitDetailsFacade } from './transit-details/transit-details.facade';
import { TransitDTO } from './transit.dto';
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
    private readonly awardsService: AwardsService,
    private readonly driverFeeService: DriverFeeService,
    private readonly geocodingService: GeocodingService,
    private readonly invoiceGenerator: InvoiceGenerator,
    private readonly distanceCalculator: DistanceCalculator,
    private readonly eventEmitter: EventEmitter2,
    private readonly transitDetailsFacade: TransitDetailsFacade,
    private readonly driverService: DriverService,
    private readonly requestTransitService: RequestTransitService,
    private readonly changePickupService: ChangePickupService,
    private readonly changeDestinationService: ChangeDestinationService,
    private readonly demandService: DemandService,
    private readonly completeTransitService: CompleteTransitService,
    private readonly startTransitService: StartTransitService,
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
    if (await this.driverAssignmentFacade.isDriverAssigned(requestUUID)) {
      throw new NotAcceptableException(
        `Driver is already assigned to transit with id = ${requestUUID}`,
      );
    }

    const newAddress = await this.addressRepository.save(address);
    const transitDetails = await this.findTransitDetails(requestUUID);
    const oldAddress = transitDetails.from.toAddressEntity();
    const newDistance = await this.changePickupService.pickupChangedTo(
      requestUUID,
      newAddress,
      oldAddress,
    );

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
    const transitDetails = await this.transitDetailsFacade.findByRequestUUID(
      requestUUID,
    );

    const oldAddress = transitDetails.to.toAddressEntity();
    const distance = await this.changeDestinationService.changeTransitAddressTo(
      requestUUID,
      savedAddress,
      oldAddress,
    );

    await this.driverAssignmentFacade.notifyAssignedDriverAboutChangedDestination(
      requestUUID,
    );
    await this.transitDetailsFacade.destinationChanged(
      requestUUID,
      savedAddress,
      distance,
    );
  }

  public async cancelTransit(requestUUID: string) {
    const transitDetailsDTO = await this.transitDetailsFacade.findByRequestUUID(
      requestUUID,
    );

    if (!transitDetailsDTO) {
      throw new NotFoundException(
        'Transit does not exist, id = ' + requestUUID,
      );
    }

    await this.demandService.cancelDemand(requestUUID);
    await this.driverAssignmentFacade.cancel(requestUUID);
    await this.transitDetailsFacade.transitCancelled(requestUUID);
  }

  public async publishTransit(requestUUID: string) {
    const now = Clock.currentDate();
    const transitDetailsDTO = await this.transitDetailsFacade.findByRequestUUID(
      requestUUID,
    );

    if (!transitDetailsDTO) {
      throw new NotFoundException(
        'Transit does not exist, id = ' + requestUUID,
      );
    }

    await this.demandService.publishDemand(requestUUID);
    await this.driverAssignmentFacade.startAssigningDrivers(
      requestUUID,
      transitDetailsDTO.from,
      transitDetailsDTO.carType,
      now,
    );
    await this.transitDetailsFacade.transitPublished(requestUUID, now);
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
    const now = Clock.currentDate();
    const driverExists = await this.driverService.exists(driverId);

    if (!driverExists) {
      throw new NotFoundException('Driver does not exist, id = ' + driverId);
    } else {
      if (await this.driverAssignmentFacade.isDriverAssigned(requestUUID)) {
        throw new NotAcceptableException(
          'Driver is already assigned to transit with id = ' + requestUUID,
        );
      }

      await this.demandService.acceptDemand(requestUUID);
      await this.driverAssignmentFacade.acceptTransit(requestUUID, driverId);
      await this.driverService.markOccupied(driverId);
      await this.transitDetailsFacade.transitAccepted(
        requestUUID,
        driverId,
        now,
      );
    }
  }

  public async startTransit(driverId: string, requestUUID: string) {
    const now = Clock.currentDate();
    const driver = await this.driverRepository.findOne(driverId);

    if (!driver) {
      throw new NotFoundException('Driver does not exist, id = ' + driverId);
    }

    if (!(await this.demandService.existsFor(requestUUID))) {
      throw new NotFoundException('Demand does not exist, id = ' + requestUUID);
    }

    if (!(await this.driverAssignmentFacade.isDriverAssigned(requestUUID))) {
      throw new NotFoundException(
        'Driver is not assigned to transit, id = ' + requestUUID,
      );
    }

    const transit = await this.startTransitService.start(requestUUID);
    await this.transitDetailsFacade.transitStarted(
      requestUUID,
      transit.getId(),
      now,
    );
  }

  public async rejectTransit(driverId: string, requestUUID: string) {
    if (!(await this.driverService.exists(driverId))) {
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
    const transitDetailsDTO = await this.transitDetailsFacade.findByRequestUUID(
      requestUUID,
    );

    const from = await this.addressRepository.findByHashOrFail(
      transitDetailsDTO.from.getHash(),
    );
    const to = await this.addressRepository.findByHashOrFail(
      destination.getHash(),
    );

    const finalPrice = await this.completeTransitService.completeTransit(
      driverId,
      requestUUID,
      from,
      to,
    );
    const driverFee = await this.driverFeeService.calculateDriverFee(
      finalPrice,
      driverId,
    );

    await this.driverService.markNotOccupied(driverId);
    await this.transitDetailsFacade.transitCompleted(
      requestUUID,
      now,
      finalPrice,
      driverFee,
    );
    await this.awardsService.registerMiles(
      transitDetailsDTO.client.getId(),
      requestUUID,
    );
    await this.invoiceGenerator.generate(
      finalPrice.toInt(),
      transitDetailsDTO.client.getName() +
        ' ' +
        transitDetailsDTO.client.getLastName(),
    );

    const transitCompletedEvent = new TransitCompletedEvent(
      transitDetailsDTO.client.getId(),
      requestUUID,
      transitDetailsDTO.from.getHash(),
      transitDetailsDTO.to.getHash(),
      transitDetailsDTO.started
        ? new Date(+transitDetailsDTO.started)
        : new Date(),
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

  private async addressFromDto(addressDTO: AddressDTO) {
    const address = addressDTO.toAddressEntity();
    return this.addressRepository.save(address);
  }

  private findTransitDetails(requestUUID: string) {
    return this.transitDetailsFacade.findByRequestUUID(requestUUID);
  }
}
