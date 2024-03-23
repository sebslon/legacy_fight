import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DistanceCalculator } from '../../geolocation/distance-calculator.service';

import { DriverReportController } from './driver-report.controller';
import { SQLBasedDriverReportCreator } from './sql-based-driver-report-creator';
import { TravelledDistance } from './travelled-distance/travelled-distance.entity';
import { TravelledDistanceRepository } from './travelled-distance/travelled-distance.repository';
import { TravelledDistanceService } from './travelled-distance/travelled-distance.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TravelledDistance, TravelledDistanceRepository]),
  ],
  controllers: [DriverReportController],
  providers: [
    SQLBasedDriverReportCreator,
    TravelledDistanceService,
    DistanceCalculator,
  ],
  exports: [SQLBasedDriverReportCreator, TravelledDistanceService],
})
export class DriverReportModule {}
