import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Address } from './address/address.entity';
import { AddressRepository } from './address/address.repository';
import { DistanceCalculator } from './distance-calculator.service';
import { GeocodingService } from './geocoding.service';

@Module({
  imports: [TypeOrmModule.forFeature([Address, AddressRepository])],
  controllers: [],
  providers: [GeocodingService, DistanceCalculator],
  exports: [GeocodingService, DistanceCalculator],
})
export class GeolocationModule {}
