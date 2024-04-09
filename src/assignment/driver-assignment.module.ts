import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CarFleetModule } from '../car-fleet/car-fleet.module';
import { DriverRepository } from '../driver-fleet/driver.repository';
import { NotificationModule } from '../notification/notification.module';
import { DriverTrackingModule } from '../tracking/driver-tracking.module';

import { DriverAssignment } from './driver-assignment.entity';
import { DriverAssignmentFacade } from './driver-assignment.facade';
import { DriverAssignmentRepository } from './driver-assignment.repository';

@Module({
  imports: [
    CarFleetModule,
    DriverTrackingModule,
    NotificationModule,
    TypeOrmModule.forFeature([
      DriverAssignment,
      DriverAssignmentRepository,
      DriverRepository,
    ]),
  ],
  controllers: [],
  providers: [DriverAssignmentFacade],
  exports: [DriverAssignmentFacade],
})
export class DriverAssignmentModule {}
