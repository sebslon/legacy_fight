import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Address } from '../geolocation/address/address.entity';
import { Distance } from '../geolocation/distance';
import { DistanceCalculator } from '../geolocation/distance-calculator.service';
import { GeocodingService } from '../geolocation/geocoding.service';

import { TransitRepository } from './transit.repository';

@Injectable()
export class CompleteTransitService {
  constructor(
    @InjectRepository(TransitRepository)
    private readonly transitRepository: TransitRepository,
    private readonly distanceCalculator: DistanceCalculator,
    private readonly geocodingService: GeocodingService,
  ) {}

  public async completeTransit(
    driverId: string,
    requestUUID: string,
    from: Address,
    destination: Address,
  ) {
    const transit = await this.transitRepository.findByTransitRequestUUID(
      requestUUID,
    );

    if (!transit) {
      throw new Error('Transit does not exist, id = ' + requestUUID);
    }

    const geoFrom = this.geocodingService.geocodeAddress(from);
    const geoTo = this.geocodingService.geocodeAddress(destination);
    const distance = Distance.fromKm(
      this.distanceCalculator.calculateByMap(
        geoFrom[0],
        geoFrom[1],
        geoTo[0],
        geoTo[1],
      ),
    );

    const finalPrice = transit.completeTransitAt(distance);

    await this.transitRepository.save(transit);

    return finalPrice;
  }
}
