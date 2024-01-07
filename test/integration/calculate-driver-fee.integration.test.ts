import { Test, TestingModule } from '@nestjs/testing';
import { getConnection } from 'typeorm';

import {
  Driver,
  DriverStatus,
  DriverType,
} from '../../src/entity/driver.entity';
import { AppModule } from '../../src/app.module';
import { CarClass } from '../../src/entity/car-type.entity';
import { DriverFee, FeeType } from '../../src/entity/driver-fee.entity';
import { DriverFeeRepository } from '../../src/repository/driver-fee.repository';
import { Transit, TransitStatus } from '../../src/entity/transit.entity';
import { TransitRepository } from '../../src/repository/transit.repository';
import { DriverFeeService } from '../../src/service/driver-fee.service';
import { DriverService } from '../../src/service/driver.service';
import { Money } from '../../src/money/money';

describe('Calculate Driver Fee', () => {
  let driverService: DriverService;
  let driverFeeService: DriverFeeService;
  let transitRepository: TransitRepository;
  let driverFeeRepository: DriverFeeRepository;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    driverService = module.get<DriverService>(DriverService);
    driverFeeService = module.get<DriverFeeService>(DriverFeeService);
    transitRepository = module.get<TransitRepository>(TransitRepository);
    driverFeeRepository = module.get<DriverFeeRepository>(DriverFeeRepository);
  });

  afterAll(async () => {
    await getConnection().close();
  });

  it('Should calculate drivers flat fee', async () => {
    const driver = await createTestDriver();
    const transit = await createTestTransit(driver, 60);

    await driverHasFee(driver, FeeType.FLAT, 10, 0);

    const fee = await driverFeeService.calculateDriverFee(transit.getId());

    expect(fee).toEqual(new Money(50));
  });

  it('Should calculate drivers percentage fee', async () => {
    const driver = await createTestDriver();
    const transit = await createTestTransit(driver, 80);

    await driverHasFee(driver, FeeType.PERCENTAGE, 50, 0);

    const fee = await driverFeeService.calculateDriverFee(transit.getId());

    expect(fee).toEqual(new Money(40));
  });

  it('Should use minimum fee', async () => {
    const minimumFee = 25;

    const driver = await createTestDriver();
    const transit = await createTestTransit(driver, 10);

    await driverHasFee(driver, FeeType.PERCENTAGE, 7, minimumFee);

    const fee = await driverFeeService.calculateDriverFee(transit.getId());

    expect(fee).toEqual(new Money(minimumFee));
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

  async function createTestTransit(driver: Driver, price: number) {
    const transit = new Transit();

    transit.setPrice(new Money(price));
    transit.setDriver(driver);
    transit.setStatus(TransitStatus.COMPLETED);
    transit.setCarType(CarClass.REGULAR);
    transit.setDateTime(Date.now());

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
