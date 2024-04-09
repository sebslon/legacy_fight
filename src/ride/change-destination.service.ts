import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Address } from '../geolocation/address/address.entity';
import { Distance } from '../geolocation/distance';
import { DistanceCalculator } from '../geolocation/distance-calculator.service';
import { GeocodingService } from '../geolocation/geocoding.service';

import { NoFurtherThan } from './rules/no-further-than.rule';
import { NotPublished } from './rules/not-published.rule';
import { OrRule } from './rules/or-rule';
import { TransitStatus } from './transit.entity';
import { TransitRepository } from './transit.repository';

@Injectable()
export class ChangeDestinationService {
  constructor(
    private readonly distanceCalculator: DistanceCalculator,
    private readonly geocodingService: GeocodingService,
    @InjectRepository(TransitRepository)
    private readonly transitRepository: TransitRepository,
  ) {}

  public async changeTransitAddressTo(
    requestUUID: string,
    newAddress: Address,
    from: Address,
  ) {
    const geoFrom = this.geocodingService.geocodeAddress(from);
    const geoTo = this.geocodingService.geocodeAddress(newAddress);

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

    return newDistance;
  }
}
