import { Controller, Get, Param } from '@nestjs/common';

import { DriverReport } from '../dto/driver-report.dto';

import { DriverReportCreator } from './driver-report-creator';

@Controller('driverreport')
export class DriverReportController {
  constructor(private readonly driverReportCreator: DriverReportCreator) {}

  @Get(':driverId')
  public async loadReportForDriver(
    @Param('driverId') driverId: string,
    @Param('lastDays') lastDays: number,
  ): Promise<DriverReport> {
    return this.driverReportCreator.create(driverId, lastDays);
  }
}
