import { Test, TestingModule } from '@nestjs/testing';
import { getConnection } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { CarClass } from '../../src/entity/car-type.entity';
import {
  Driver,
  DriverStatus,
  DriverType,
} from '../../src/entity/driver.entity';
import { DriverFee, FeeType } from '../../src/entity/driver-fee.entity';
import { Month, Transit, TransitStatus } from '../../src/entity/transit.entity';
import { DriverFeeRepository } from '../../src/repository/driver-fee.repository';
import { TransitRepository } from '../../src/repository/transit.repository';
import { DriverService } from '../../src/service/driver.service';

describe('Calculate Driver Periodic Payments', () => {
  let driverService: DriverService;
  let transitRepository: TransitRepository;
  let driverFeeRepository: DriverFeeRepository;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    driverService = module.get<DriverService>(DriverService);
    transitRepository = module.get<TransitRepository>(TransitRepository);
    driverFeeRepository = module.get<DriverFeeRepository>(DriverFeeRepository);
  });

  afterAll(async () => {
    await getConnection().close();
  });

  it('Calculates monthly payment', async () => {
    const driver = await createTestDriver();

    await createTestTransit(driver, 100, new Date('2023-10-01'));
    await createTestTransit(driver, 100, new Date('2023-10-15'));
    await createTestTransit(driver, 100, new Date('2023-10-23'));
    await createTestTransit(driver, 100, new Date('2023-11-01'));
    await createTestTransit(driver, 100, new Date('2023-11-15'));
    await createTestTransit(driver, 100, new Date('2023-12-23'));

    await driverHasFee(driver, FeeType.FLAT, 10, 0);

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
    const driver = await createTestDriver();

    await createTestTransit(driver, 100, new Date('2023-10-01'));
    await createTestTransit(driver, 100, new Date('2023-10-15'));
    await createTestTransit(driver, 100, new Date('2023-10-01'));
    await createTestTransit(driver, 100, new Date('2023-10-15'));
    await createTestTransit(driver, 100, new Date('2023-11-01'));
    await createTestTransit(driver, 100, new Date('2023-11-15'));
    await createTestTransit(driver, 100, new Date('2023-11-01'));
    await createTestTransit(driver, 100, new Date('2023-12-15'));

    await driverHasFee(driver, FeeType.FLAT, 10, 0);

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

  function createTestDriver() {
    return driverService.createDriver({
      firstName: 'Test',
      lastName: 'Driver',
      driverLicense: 'FARME100165AB5EW',
      type: DriverType.REGULAR,
      status: DriverStatus.ACTIVE,
      photo: Buffer.from('test', 'utf-8').toString('base64'),
    });
  }

  async function createTestTransit(driver: Driver, price: number, when: Date) {
    const transit = new Transit();

    transit.setPrice(price);
    transit.setDriver(driver);
    transit.setStatus(TransitStatus.COMPLETED);
    transit.setCarType(CarClass.REGULAR);
    transit.setDateTime(new Date(when).getTime());

    await transitRepository.save(transit);

    return transit;
  }

  async function driverHasFee(
    driver: Driver,
    feeType: FeeType,
    amount: number,
    min: number,
  ) {
    const driverFee = new DriverFee(feeType, driver, amount, min);

    await driverFeeRepository.save(driverFee);

    return driverFee;
  }
});
