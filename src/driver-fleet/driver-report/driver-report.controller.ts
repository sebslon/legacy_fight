import { Controller, Get, Param } from '@nestjs/common';

import { DriverReport } from './driver-report.dto';
import { SQLBasedDriverReportCreator } from './sql-based-driver-report-creator';

@Controller('driverreport')
export class DriverReportController {
  constructor(
    private readonly driverReportCreator: SQLBasedDriverReportCreator,
  ) {}

  @Get(':driverId')
  public async loadReportForDriver(
    @Param('driverId') driverId: string,
    @Param('lastDays') lastDays: number,
  ): Promise<DriverReport> {
    return this.driverReportCreator.createReport(driverId, lastDays);
  }
}
