import { Injectable } from '@nestjs/common';

import { FeatureFlags } from '../config/feature-flags';

import { OldDriverReportCreator } from './old-driver-report-creator';
import { SQLBasedDriverReportCreator } from './sql-based-driver-report-creator';

@Injectable()
export class DriverReportCreator {
  constructor(
    private readonly sqlBasedDriverReportCreator: SQLBasedDriverReportCreator,
    private readonly oldDriverReportCreator: OldDriverReportCreator,
  ) {}

  public async create(driverId: string, lastDays: number) {
    if (this.shouldUseNewReport()) {
      return this.sqlBasedDriverReportCreator.createReport(driverId, lastDays);
    } else {
      return this.oldDriverReportCreator.createReport(driverId, lastDays);
    }
  }

  private shouldUseNewReport() {
    return FeatureFlags.newDriverReport.isActive();
  }
}
