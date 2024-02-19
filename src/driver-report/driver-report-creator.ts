import { Inject, Injectable } from '@nestjs/common';

import { FeatureFlags } from '../config/feature-flags';
import { DriverReport } from '../dto/driver-report.dto';

import { DriverReportTokens } from './driver-report.tokens';
import { OldDriverReportCreator } from './old-driver-report-creator';
import { SQLBasedDriverReportCreator } from './sql-based-driver-report-creator';

@Injectable()
export class DriverReportCreator {
  constructor(
    private readonly sqlBasedDriverReportCreator: SQLBasedDriverReportCreator,
    private readonly oldDriverReportCreator: OldDriverReportCreator,
    @Inject(DriverReportTokens.DriverReportReconciliation)
    private readonly driverReportReconciliation: DriverReportReconciliation,
  ) {}

  public async create(driverId: string, lastDays: number) {
    let newReport = null;
    let oldReport = null;

    if (this.shouldCompareReports()) {
      [newReport, oldReport] = await Promise.all([
        this.sqlBasedDriverReportCreator.createReport(driverId, lastDays),
        this.oldDriverReportCreator.createReport(driverId, lastDays),
      ]);

      this.driverReportReconciliation.compare(oldReport, newReport);
    }

    if (this.shouldUseNewReport()) {
      if (!newReport) {
        newReport = await this.sqlBasedDriverReportCreator.createReport(
          driverId,
          lastDays,
        );
      }
      return newReport;
    } else {
      if (!oldReport) {
        oldReport = await this.oldDriverReportCreator.createReport(
          driverId,
          lastDays,
        );
      }
      return oldReport;
    }
  }

  private shouldUseNewReport() {
    return FeatureFlags.newDriverReport.isActive();
  }

  private shouldCompareReports() {
    return FeatureFlags.driverReportCreationReconciliation.isActive();
  }
}

export interface DriverReportReconciliation {
  compare(oldOne: DriverReport, newOne: DriverReport): void;
}

@Injectable()
export class TestDummyReconciliation implements DriverReportReconciliation {
  public compare() {
    // send some event to the monitoring system or something
    return;
  }
}
