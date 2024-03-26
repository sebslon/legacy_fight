import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DistanceCalculator } from '../../../geolocation/distance-calculator.service';

import { TravelledDistance } from './travelled-distance.entity';
import { TravelledDistanceRepository } from './travelled-distance.repository';
import { TravelledDistanceService } from './travelled-distance.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TravelledDistance, TravelledDistanceRepository]),
  ],
  controllers: [],
  providers: [DistanceCalculator, TravelledDistanceService],
  exports: [TravelledDistanceService],
})
export class TravelledDistanceModule {}
