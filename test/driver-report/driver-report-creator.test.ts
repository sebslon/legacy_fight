import {
  DriverReportCreator,
  DriverReportReconciliation,
} from '../../src/driver-report/old/driver-report-creator';
import { OldDriverReportCreator } from '../../src/driver-report/old/old-driver-report-creator';
import { SQLBasedDriverReportCreator } from '../../src/driver-report/sql-based-driver-report-creator';
import { DriverReport } from '../../src/dto/driver-report.dto';

describe('Driver Report Creator', () => {
  const LAST_DAYS = 3;
  const DRIVER_ID = '123';
  const SQL_REPORT = new DriverReport();
  const OLD_REPORT = new DriverReport();

  let driverReportCreator: DriverReportCreator;

  const sqlBasedDriverReportCreator = {
    createReport: jest.fn(),
  } as unknown as SQLBasedDriverReportCreator;
  const oldDriverReportCreator = {
    createReport: jest.fn(),
  } as unknown as OldDriverReportCreator;
  const driverReportReconciliation = {
    compare: jest.fn(),
  } as unknown as DriverReportReconciliation;

  beforeEach(() => {
    jest.clearAllMocks();

    driverReportCreator = new DriverReportCreator(
      sqlBasedDriverReportCreator,
      oldDriverReportCreator,
      driverReportReconciliation,
    );
  });

  it('Calls new report creator when feature flag is active', async () => {
    process.env.NEW_DRIVER_REPORT = 'true';
    process.env.DRIVER_REPORT_CREATION_RECONCILIATION = 'false';
    newSQLWayReturnedReport();

    await driverReportCreator.create(DRIVER_ID, LAST_DAYS);

    expect(sqlBasedDriverReportCreator.createReport).toHaveBeenCalledWith(
      DRIVER_ID,
      LAST_DAYS,
    );
    expect(oldDriverReportCreator.createReport).not.toHaveBeenCalled();
  });

  it('Calls old report creator when feature flag is inactive', async () => {
    process.env.NEW_DRIVER_REPORT = 'false';
    process.env.DRIVER_REPORT_CREATION_RECONCILIATION = 'false';
    oldWayReturnedReport();

    await driverReportCreator.create(DRIVER_ID, LAST_DAYS);

    expect(oldDriverReportCreator.createReport).toHaveBeenCalledWith(
      DRIVER_ID,
      LAST_DAYS,
    );
    expect(sqlBasedDriverReportCreator.createReport).not.toHaveBeenCalled();
  });

  it('Calls Reconciliation and uses old report when New Report FF is off', async () => {
    process.env.NEW_DRIVER_REPORT = 'false';
    process.env.DRIVER_REPORT_CREATION_RECONCILIATION = 'true';
    bothWaysReturnedReport();

    await driverReportCreator.create(DRIVER_ID, LAST_DAYS);

    expect(oldDriverReportCreator.createReport).toHaveBeenCalledWith(
      DRIVER_ID,
      LAST_DAYS,
    );
    expect(sqlBasedDriverReportCreator.createReport).toHaveBeenCalledWith(
      DRIVER_ID,
      LAST_DAYS,
    );
    expect(driverReportReconciliation.compare).toHaveBeenCalledWith(
      OLD_REPORT,
      SQL_REPORT,
    );
  });

  it('Calls Reconciliation and uses new report when New Report FF is on', async () => {
    process.env.NEW_DRIVER_REPORT = 'true';
    process.env.DRIVER_REPORT_CREATION_RECONCILIATION = 'true';
    bothWaysReturnedReport();

    await driverReportCreator.create(DRIVER_ID, LAST_DAYS);

    expect(sqlBasedDriverReportCreator.createReport).toHaveBeenCalledWith(
      DRIVER_ID,
      LAST_DAYS,
    );
    expect(oldDriverReportCreator.createReport).toHaveBeenCalledWith(
      DRIVER_ID,
      LAST_DAYS,
    );
    expect(driverReportReconciliation.compare).toHaveBeenCalledWith(
      OLD_REPORT,
      SQL_REPORT,
    );
  });

  // Helper Functions

  function bothWaysReturnedReport() {
    newSQLWayReturnedReport();
    oldWayReturnedReport();
  }

  function newSQLWayReturnedReport() {
    jest
      .spyOn(sqlBasedDriverReportCreator, 'createReport')
      .mockResolvedValueOnce(SQL_REPORT);
  }

  function oldWayReturnedReport() {
    jest
      .spyOn(oldDriverReportCreator, 'createReport')
      .mockResolvedValueOnce(OLD_REPORT);
  }
});
