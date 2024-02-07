import { Controller, Get, Param } from '@nestjs/common';

import { DriverReport } from '../dto/driver-report.dto';

import { SQLBasedDriverReportCreator } from './ui/sql-based-driver-report-creator';

@Controller('driverreport')
export class DriverReportController {
  constructor(
    private sqlBasedDriverReportCreator: SQLBasedDriverReportCreator,
  ) {}

  @Get(':driverId')
  public async loadReportForDriver(
    @Param('driverId') driverId: string,
    @Param('lastDays') lastDays: number,
  ): Promise<DriverReport> {
    return this.sqlBasedDriverReportCreator.createReport(driverId, lastDays);
  }
}
