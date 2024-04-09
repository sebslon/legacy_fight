import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DistanceCalculator } from '../../geolocation/distance-calculator.service';

import { DriverReportController } from './driver-report.controller';
import { SQLBasedDriverReportCreator } from './sql-based-driver-report-creator';
import { TravelledDistance } from './travelled-distance/travelled-distance.entity';
import { TravelledDistanceModule } from './travelled-distance/travelled-distance.module';
import { TravelledDistanceRepository } from './travelled-distance/travelled-distance.repository';

@Module({
  imports: [
    TravelledDistanceModule,
    TypeOrmModule.forFeature([TravelledDistance, TravelledDistanceRepository]),
  ],
  controllers: [DriverReportController],
  providers: [SQLBasedDriverReportCreator, DistanceCalculator],
  exports: [SQLBasedDriverReportCreator],
})
export class DriverReportModule {}
