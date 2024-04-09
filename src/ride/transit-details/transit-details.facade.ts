import { Injectable } from '@nestjs/common';

import { InvolvedDriversSummary } from '../../assignment/involved-drivers-summary';
import { CarClass } from '../../car-fleet/car-class.enum';
import { Client } from '../../crm/client.entity';
import { Driver } from '../../driver-fleet/driver.entity';
import { Address } from '../../geolocation/address/address.entity';
import { Distance } from '../../geolocation/distance';
import { Money } from '../../money/money';
import { Tariff } from '../../pricing/tariff';
import { TransitStatus } from '../transit.entity';

import { TransitDetailsDTO } from './transit-details.dto';
import { TransitDetails } from './transit-details.entity';
import { TransitDetailsRepository } from './transit-details.repository';

@Injectable()
export class TransitDetailsFacade {
  public constructor(
    private readonly transitDetailsRepository: TransitDetailsRepository,
  ) {}

  public async findByTransitId(transitId: string): Promise<TransitDetailsDTO> {
    return TransitDetailsDTO.fromTransitDetails(
      await this.loadByTransitId(transitId),
    );
  }

  public async findByRequestUUID(
    requestUUID: string,
  ): Promise<TransitDetailsDTO> {
    return TransitDetailsDTO.fromTransitDetails(
      await this.loadByRequestUUID(requestUUID),
    );
  }

  public async transitRequested(
    when: Date,
    requestUUID: string,
    from: Address,
    to: Address,
    distance: Distance,
    client: Client,
    carClass: CarClass,
    estimatedPrice: Money,
    tariff: Tariff,
  ) {
    const transitDetails = new TransitDetails(
      when,
      requestUUID,
      from,
      to,
      distance,
      client,
      carClass,
      estimatedPrice,
      tariff,
    );

    return await this.transitDetailsRepository.save(transitDetails);
  }

  public async pickupChangedTo(
    transitRequestUUID: string,
    newAddress: Address,
    newDistance: Distance,
  ) {
    const details = await this.loadByRequestUUID(transitRequestUUID);
    details.pickupChangedTo(newAddress, newDistance);

    return await this.transitDetailsRepository.save(details);
  }

  public async destinationChanged(requestUUID: string, newAddress: Address) {
    const details = await this.loadByRequestUUID(requestUUID);
    details.destinationChangedTo(newAddress);

    return await this.transitDetailsRepository.save(details);
  }

  public async transitPublished(requestUUID: string, publishedAt: Date) {
    const details = await this.loadByRequestUUID(requestUUID);
    details.published(publishedAt);

    return await this.transitDetailsRepository.save(details);
  }

  public async transitAccepted(
    requestUUID: string,
    when: Date,
    driver: Driver,
  ) {
    const details = await this.loadByRequestUUID(requestUUID);
    details.accepted(when, driver);

    return await this.transitDetailsRepository.save(details);
  }

  public async transitStarted(
    requestUUID: string,
    transitId: string,
    startedAt: Date,
  ) {
    const details = await this.loadByRequestUUID(requestUUID);
    details.started(startedAt, transitId);

    return await this.transitDetailsRepository.save(details);
  }

  public async transitCancelled(requestUUID: string) {
    const details = await this.loadByRequestUUID(requestUUID);
    details.cancelled();

    return await this.transitDetailsRepository.save(details);
  }

  public async transitCompleted(
    requestUUID: string,
    when: Date,
    price: Money,
    driverFee: Money,
  ) {
    const details = await this.loadByRequestUUID(requestUUID);

    details.completed(when, price, driverFee);

    return await this.transitDetailsRepository.save(details);
  }

  public async findByClient(clientId: string): Promise<TransitDetailsDTO[]> {
    return (
      await this.transitDetailsRepository.findManyByClientId(clientId)
    ).map((details) => TransitDetailsDTO.fromTransitDetails(details));
  }

  public async findByDriver(
    driverId: string,
    from: Date,
    to: Date,
  ): Promise<TransitDetailsDTO[]> {
    return (
      await this.transitDetailsRepository.findAllByDriverAndDateTimeBetween(
        driverId,
        from,
        to,
      )
    ).map((details) => TransitDetailsDTO.fromTransitDetails(details));
  }

  public async findCompleted(): Promise<TransitDetailsDTO[]> {
    const completed = await this.transitDetailsRepository.findByStatus(
      TransitStatus.COMPLETED,
    );

    return completed.map((details) =>
      TransitDetailsDTO.fromTransitDetails(details),
    );
  }

  public async driversAreInvolved(
    requestId: string,
    involvedDriversSummary: InvolvedDriversSummary,
  ) {
    const details = await this.loadByRequestUUID(requestId);
    details.involvedDriversAre(involvedDriversSummary);

    return await this.transitDetailsRepository.save(details);
  }

  private async loadByTransitId(transitId: string): Promise<TransitDetails> {
    const details = await this.transitDetailsRepository.findByTransitId(
      transitId,
    );

    if (!details) {
      throw new Error(`Transit details not found, id = ${transitId}`);
    }

    return details;
  }

  private async loadByRequestUUID(
    requestUUID: string,
  ): Promise<TransitDetails> {
    const details = await this.transitDetailsRepository.findByRequestUUID(
      requestUUID,
    );

    if (!details) {
      throw new Error(
        `Transit details not found, requestUUID = ${requestUUID}`,
      );
    }

    return details;
  }
}
