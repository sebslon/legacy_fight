import { Test, TestingModule } from '@nestjs/testing';
import { getConnection } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { FeeType } from '../../src/driver-fleet/driver-fee.entity';
import { DriverFeeService } from '../../src/driver-fleet/driver-fee.service';
import { Money } from '../../src/money/money';
import { Fixtures } from '../common/fixtures';

describe('Calculate Driver Fee', () => {
  let driverFeeService: DriverFeeService;
  let fixtures: Fixtures;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    driverFeeService = module.get<DriverFeeService>(DriverFeeService);

    fixtures = module.get<Fixtures>(Fixtures);
  });

  afterAll(async () => {
    await getConnection().close();
  });

  it('Should calculate drivers flat fee', async () => {
    const driver = await fixtures.createTestDriver();

    await fixtures.driverHasFee(driver, FeeType.FLAT, 10, 0);

    const fee = await driverFeeService.calculateDriverFee(
      new Money(60),
      driver.getId(),
    );

    expect(fee).toEqual(new Money(50));
  });

  it('Should calculate drivers percentage fee', async () => {
    const driver = await fixtures.createTestDriver();

    await fixtures.driverHasFee(driver, FeeType.PERCENTAGE, 50, 0);

    const fee = await driverFeeService.calculateDriverFee(
      new Money(80),
      driver.getId(),
    );

    expect(fee).toEqual(new Money(40));
  });

  it('Should use minimum fee', async () => {
    const minimumFee = 25;

    const driver = await fixtures.createTestDriver();

    await fixtures.driverHasFee(driver, FeeType.PERCENTAGE, 7, minimumFee);

    const fee = await driverFeeService.calculateDriverFee(
      new Money(10),
      driver.getId(),
    );

    expect(fee).toEqual(new Money(minimumFee));
  });
});
