import { Test, TestingModule } from '@nestjs/testing';
import { getConnection } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { Month } from '../../src/common/month';
import { FeeType } from '../../src/driver-fleet/driver-fee.entity';
import { DriverService } from '../../src/driver-fleet/driver.service';
import { Fixtures } from '../common/fixtures';

describe('Calculate Driver Periodic Payments', () => {
  let driverService: DriverService;
  let fixtures: Fixtures;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    driverService = module.get<DriverService>(DriverService);

    fixtures = module.get<Fixtures>(Fixtures);
  });

  afterAll(async () => {
    await getConnection().close();
  });

  it('Calculates monthly payment', async () => {
    const driver = await fixtures.createTestDriver();

    await fixtures.createTransitDetails(driver, 100, new Date('2023-10-01'));
    await fixtures.createTransitDetails(driver, 100, new Date('2023-10-15'));
    await fixtures.createTransitDetails(driver, 100, new Date('2023-10-23'));
    await fixtures.createTransitDetails(driver, 100, new Date('2023-11-01'));
    await fixtures.createTransitDetails(driver, 100, new Date('2023-11-15'));
    await fixtures.createTransitDetails(driver, 100, new Date('2023-12-23'));

    await fixtures.driverHasFee(driver, FeeType.FLAT, 10, 0);

    const feeOctober = await driverService.calculateDriverMonthlyPayment(
      driver.getId(),
      2023,
      10,
    );

    expect(feeOctober).toBe(270);

    const feeNovember = await driverService.calculateDriverMonthlyPayment(
      driver.getId(),
      2023,
      11,
    );

    expect(feeNovember).toBe(180);

    const feeDecember = await driverService.calculateDriverMonthlyPayment(
      driver.getId(),
      2023,
      12,
    );

    expect(feeDecember).toBe(90);
  });

  it('Calculates yearly payment', async () => {
    const driver = await fixtures.createTestDriver();

    await fixtures.createTransitDetails(driver, 100, new Date('2023-10-01'));
    await fixtures.createTransitDetails(driver, 100, new Date('2023-10-15'));
    await fixtures.createTransitDetails(driver, 100, new Date('2023-10-01'));
    await fixtures.createTransitDetails(driver, 100, new Date('2023-10-15'));
    await fixtures.createTransitDetails(driver, 100, new Date('2023-11-01'));
    await fixtures.createTransitDetails(driver, 100, new Date('2023-11-15'));
    await fixtures.createTransitDetails(driver, 100, new Date('2023-11-01'));
    await fixtures.createTransitDetails(driver, 100, new Date('2023-12-15'));

    await fixtures.driverHasFee(driver, FeeType.FLAT, 10, 0);

    const payments = await driverService.calculateDriverYearlyPayment(
      driver.getId(),
      2023,
    );

    expect(payments.get(Month.JANUARY)).toBe(0);
    expect(payments.get(Month.FEBRUARY)).toBe(0);
    expect(payments.get(Month.MARCH)).toBe(0);
    expect(payments.get(Month.APRIL)).toBe(0);
    expect(payments.get(Month.MAY)).toBe(0);
    expect(payments.get(Month.JUNE)).toBe(0);
    expect(payments.get(Month.JULY)).toBe(0);
    expect(payments.get(Month.AUGUST)).toBe(0);
    expect(payments.get(Month.SEPTEMBER)).toBe(0);
    expect(payments.get(Month.OCTOBER)).toBe(360);
    expect(payments.get(Month.NOVEMBER)).toBe(270);
    expect(payments.get(Month.DECEMBER)).toBe(90);
  });
});
