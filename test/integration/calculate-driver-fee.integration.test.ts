import { Test, TestingModule } from '@nestjs/testing';
import { getConnection } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { FeeType } from '../../src/entity/driver-fee.entity';
import { Money } from '../../src/money/money';
import { DriverFeeService } from '../../src/service/driver-fee.service';
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
    const transit = await fixtures.createTestTransit(driver, 60);

    await fixtures.driverHasFee(driver, FeeType.FLAT, 10, 0);

    const fee = await driverFeeService.calculateDriverFee(transit.getId());

    expect(fee).toEqual(new Money(50));
  });

  it('Should calculate drivers percentage fee', async () => {
    const driver = await fixtures.createTestDriver();
    const transit = await fixtures.createTestTransit(driver, 80);

    await fixtures.driverHasFee(driver, FeeType.PERCENTAGE, 50, 0);

    const fee = await driverFeeService.calculateDriverFee(transit.getId());

    expect(fee).toEqual(new Money(40));
  });

  it('Should use minimum fee', async () => {
    const minimumFee = 25;

    const driver = await fixtures.createTestDriver();
    const transit = await fixtures.createTestTransit(driver, 10);

    await fixtures.driverHasFee(driver, FeeType.PERCENTAGE, 7, minimumFee);

    const fee = await driverFeeService.calculateDriverFee(transit.getId());

    expect(fee).toEqual(new Money(minimumFee));
  });
});
