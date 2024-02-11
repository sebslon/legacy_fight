import { DriverReportCreator } from '../../src/driver-report/driver-report-creator';
import { OldDriverReportCreator } from '../../src/driver-report/old-driver-report-creator';
import { SQLBasedDriverReportCreator } from '../../src/driver-report/sql-based-driver-report-creator';

describe('Driver Report Creator', () => {
  const LAST_DAYS = 3;
  const DRIVER_ID = '123';

  let driverReportCreator: DriverReportCreator;

  const sqlBasedDriverReportCreator = {
    createReport: jest.fn(),
  } as unknown as SQLBasedDriverReportCreator;
  const oldDriverReportCreator = {
    createReport: jest.fn(),
  } as unknown as OldDriverReportCreator;

  beforeEach(() => {
    driverReportCreator = new DriverReportCreator(
      sqlBasedDriverReportCreator,
      oldDriverReportCreator,
    );
  });

  it('Calls new report creator when feature flag is active', async () => {
    process.env.NEW_DRIVER_REPORT = 'true';

    await driverReportCreator.create(DRIVER_ID, LAST_DAYS);

    expect(sqlBasedDriverReportCreator.createReport).toHaveBeenCalledWith(
      DRIVER_ID,
      LAST_DAYS,
    );
  });

  it('Calls old report creator when feature flag is inactive', async () => {
    process.env.NEW_DRIVER_REPORT = 'false';

    await driverReportCreator.create(DRIVER_ID, LAST_DAYS);

    expect(oldDriverReportCreator.createReport).toHaveBeenCalledWith(
      DRIVER_ID,
      LAST_DAYS,
    );
  });
});
