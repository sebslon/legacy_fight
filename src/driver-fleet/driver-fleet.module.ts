import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TransitDetailsModule } from '../transit-details/transit-details.module';

import { DriverAttribute } from './driver-attribute.entity';
import { DriverAttributeRepository } from './driver-attribute.repository';
import { DriverFee } from './driver-fee.entity';
import { DriverFeeRepository } from './driver-fee.repository';
import { DriverFeeService } from './driver-fee.service';
import { DriverReportModule } from './driver-report/driver-report.module';
import { DriverController } from './driver.controller';
import { Driver } from './driver.entity';
import { DriverRepository } from './driver.repository';
import { DriverService } from './driver.service';

@Module({
  imports: [
    TransitDetailsModule,
    DriverReportModule,
    TypeOrmModule.forFeature([
      DriverAttribute,
      DriverAttributeRepository,
      DriverFee,
      DriverFeeRepository,
      Driver,
      DriverRepository,
    ]),
  ],
  controllers: [DriverController],
  providers: [DriverService, DriverFeeService],
  exports: [DriverService, DriverFeeService],
})
export class DriverFleetModule {}
