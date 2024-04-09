import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Address } from '../geolocation/address/address.entity';
import { AddressRepository } from '../geolocation/address/address.repository';
import { Distance } from '../geolocation/distance';
import { DistanceCalculator } from '../geolocation/distance-calculator.service';
import { GeocodingService } from '../geolocation/geocoding.service';

import { TransitDemandRepository } from './transit-demand.repository';

@Injectable()
export class ChangePickupService {
  constructor(
    private readonly distanceCalculator: DistanceCalculator,
    private readonly geocodingService: GeocodingService,
    @InjectRepository(AddressRepository)
    private readonly addressRepository: AddressRepository,
    @InjectRepository(TransitDemandRepository)
    private readonly transitDemandRepository: TransitDemandRepository,
  ) {}

  public async pickupChangedTo(
    requestUUID: string,
    newAddress: Address,
    oldAddress: Address,
  ) {
    const transitDemand =
      await this.transitDemandRepository.findByTransitRequestUUID(requestUUID);

    if (!transitDemand) {
      throw new NotFoundException(
        `Transit demand does not exist, id = ${requestUUID}`,
      );
    }

    const { newDistance, distanceInKMeters } =
      this.calculateDistanceBetweenAddresses(newAddress, oldAddress);

    transitDemand.changePickup(distanceInKMeters);
    await this.transitDemandRepository.save(transitDemand);

    return newDistance;
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
}
