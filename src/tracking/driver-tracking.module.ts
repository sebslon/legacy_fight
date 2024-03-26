import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CarFleetModule } from '../car-fleet/car-fleet.module';
import { DriverFleetModule } from '../driver-fleet/driver-fleet.module';
import { TravelledDistanceModule } from '../driver-fleet/driver-report/travelled-distance/travelled-distance.module';
import { DriverRepository } from '../driver-fleet/driver.repository';

import { DriverPosition } from './driver-position.entity';
import { DriverPositionRepository } from './driver-position.repository';
import { DriverSessionController } from './driver-session.controller';
import { DriverSession } from './driver-session.entity';
import { DriverSessionRepository } from './driver-session.repository';
import { DriverSessionService } from './driver-session.service';
import { DriverTrackingController } from './driver-tracking.controller';
import { DriverTrackingService } from './driver-tracking.service';

@Module({
  imports: [
    DriverFleetModule,
    TravelledDistanceModule,
    CarFleetModule,
    TypeOrmModule.forFeature([
      DriverRepository,
      DriverPosition,
      DriverPositionRepository,
      DriverSession,
      DriverSessionRepository,
    ]),
  ],
  controllers: [DriverTrackingController, DriverSessionController],
  providers: [DriverTrackingService, DriverSessionService],
  exports: [DriverTrackingService, DriverSessionService],
})
export class DriverTrackingModule {}
