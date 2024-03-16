import { Injectable } from '@nestjs/common';
import { Driver } from 'src/entity/driver.entity';

import { Distance } from '../distance/distance';
import { Address } from '../entity/address.entity';
import { CarClass } from '../entity/car-type.entity';
import { Client } from '../entity/client.entity';
import { Tariff } from '../entity/tariff.entity';
import { Money } from '../money/money';

import { TransitDetailsDTO } from './transit-details.dto';
import { TransitDetails } from './transit-details.entity';
import { TransitDetailsRepository } from './transit-details.repository';

@Injectable()
export class TransitDetailsFacade {
  public constructor(
    private readonly transitDetailsRepository: TransitDetailsRepository,
  ) {}

  public async find(transitId: string): Promise<TransitDetailsDTO> {
    return TransitDetailsDTO.fromTransitDetails(await this.load(transitId));
  }

  public async transitRequested(
    when: Date,
    transitId: string,
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
      transitId,
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
    transitId: string,
    newAddress: Address,
    newDistance: Distance,
  ) {
    const details = await this.load(transitId);
    details.pickupChangedTo(newAddress, newDistance);

    return await this.transitDetailsRepository.save(details);
  }

  public async destinationChanged(
    transitId: string,
    newAddress: Address,
    newDistance: Distance,
  ) {
    const details = await this.load(transitId);
    details.destinationChangedTo(newAddress, newDistance);

    return await this.transitDetailsRepository.save(details);
  }

  public async transitPublished(transitId: string, publishedAt: Date) {
    const details = await this.load(transitId);
    details.published(publishedAt);

    return await this.transitDetailsRepository.save(details);
  }

  public async transitAccepted(transitId: string, when: Date, driver: Driver) {
    const details = await this.load(transitId);
    details.accepted(when, driver);

    return await this.transitDetailsRepository.save(details);
  }

  public async transitStarted(transitId: string, startedAt: Date) {
    const details = await this.load(transitId);
    details.started(startedAt);

    return await this.transitDetailsRepository.save(details);
  }

  public async transitCancelled(transitId: string) {
    const details = await this.load(transitId);
    details.cancelled();

    return await this.transitDetailsRepository.save(details);
  }

  public async transitCompleted(
    transitId: string,
    when: Date,
    price: Money,
    driverFee: Money,
  ) {
    const details = await this.load(transitId);

    details.completed(when, price, driverFee);

    return await this.transitDetailsRepository.save(details);
  }

  private async load(transitId: string): Promise<TransitDetails> {
    const details = await this.transitDetailsRepository.findByTransitId(
      transitId,
    );

    if (!details) {
      throw new Error(`Transit details not found, id = ${transitId}`);
    }

    return details;
  }
}
