import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Clock } from '../common/clock';
import { Address } from '../geolocation/address/address.entity';
import { Distance } from '../geolocation/distance';
import { DistanceCalculator } from '../geolocation/distance-calculator.service';
import { GeocodingService } from '../geolocation/geocoding.service';
import { Tariffs } from '../pricing/tariffs';

import { RequestForTransit } from './request-for-transit.entity';
import { RequestForTransitRepository } from './request-for-transit.repository';

@Injectable()
export class RequestTransitService {
  constructor(
    private readonly distanceCalculator: DistanceCalculator,
    private readonly geocodingService: GeocodingService,
    @InjectRepository(RequestForTransitRepository)
    private readonly requestForTransitRepository: RequestForTransitRepository,
    private readonly tariffs: Tariffs,
  ) {}

  public async createRequestForTransit(from: Address, to: Address) {
    const now = Clock.currentDate();

    const geoFrom = this.geocodingService.geocodeAddress(from);
    const geoTo = this.geocodingService.geocodeAddress(to);

    const distance = Distance.fromKm(
      this.distanceCalculator.calculateByMap(
        geoFrom[0],
        geoFrom[1],
        geoTo[0],
        geoTo[1],
      ),
    );

    const tariff = this.chooseTariff(now);
    const requestForTransit = await this.requestForTransitRepository.save(
      new RequestForTransit(tariff, distance),
    );

    return requestForTransit;
  }

  public async findCalculationUUID(requestUUID: string) {
    return (
      await this.requestForTransitRepository.findByRequestUUID(requestUUID)
    )?.getRequestUUID();
  }

  public async findTariff(requestUUID: string) {
    return (
      await this.requestForTransitRepository.findByRequestUUID(requestUUID)
    )?.getTariff();
  }

  private chooseTariff(when: Date) {
    return this.tariffs.choose(when);
  }
}
