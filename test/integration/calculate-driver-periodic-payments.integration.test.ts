import { Test, TestingModule } from '@nestjs/testing';
import { getConnection } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { FeeType } from '../../src/entity/driver-fee.entity';
import { Month } from '../../src/entity/transit.entity';
import { AddressRepository } from '../../src/repository/address.repository';
import { ClientRepository } from '../../src/repository/client.repository';
import { DriverAttributeRepository } from '../../src/repository/driver-attribute.repository';
import { DriverFeeRepository } from '../../src/repository/driver-fee.repository';
import { TransitRepository } from '../../src/repository/transit.repository';
import { AwardsService } from '../../src/service/awards.service';
import { CarTypeService } from '../../src/service/car-type.service';
import { ClaimService } from '../../src/service/claim.service';
import { DriverSessionService } from '../../src/service/driver-session.service';
import { DriverTrackingService } from '../../src/service/driver-tracking.service';
import { DriverService } from '../../src/service/driver.service';
import { TransitService } from '../../src/service/transit.service';
import { Fixtures } from '../common/fixtures';

describe('Calculate Driver Periodic Payments', () => {
  let driverService: DriverService;
  let transitRepository: TransitRepository;
  let driverFeeRepository: DriverFeeRepository;
  let clientRepository: ClientRepository;
  let addressRepository: AddressRepository;
  let fixtures: Fixtures;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    driverService = module.get<DriverService>(DriverService);
    transitRepository = module.get<TransitRepository>(TransitRepository);
    driverFeeRepository = module.get<DriverFeeRepository>(DriverFeeRepository);
    clientRepository = module.get<ClientRepository>(ClientRepository);
    addressRepository = module.get<AddressRepository>(AddressRepository);

    fixtures = new Fixtures(
      driverService,
      driverFeeRepository,
      transitRepository,
      addressRepository,
      clientRepository as ClientRepository,
      {} as CarTypeService,
      {} as ClaimService,
      {} as AwardsService,
      {} as DriverAttributeRepository,
      {} as TransitService,
      {} as DriverSessionService,
      {} as DriverTrackingService,
    );
  });

  afterAll(async () => {
    await getConnection().close();
  });

  it('Calculates monthly payment', async () => {
    const driver = await fixtures.createTestDriver();

    await fixtures.createTestTransit(driver, 100, new Date('2023-10-01'));
    await fixtures.createTestTransit(driver, 100, new Date('2023-10-15'));
    await fixtures.createTestTransit(driver, 100, new Date('2023-10-23'));
    await fixtures.createTestTransit(driver, 100, new Date('2023-11-01'));
    await fixtures.createTestTransit(driver, 100, new Date('2023-11-15'));
    await fixtures.createTestTransit(driver, 100, new Date('2023-12-23'));

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

    await fixtures.createTestTransit(driver, 100, new Date('2023-10-01'));
    await fixtures.createTestTransit(driver, 100, new Date('2023-10-15'));
    await fixtures.createTestTransit(driver, 100, new Date('2023-10-01'));
    await fixtures.createTestTransit(driver, 100, new Date('2023-10-15'));
    await fixtures.createTestTransit(driver, 100, new Date('2023-11-01'));
    await fixtures.createTestTransit(driver, 100, new Date('2023-11-15'));
    await fixtures.createTestTransit(driver, 100, new Date('2023-11-01'));
    await fixtures.createTestTransit(driver, 100, new Date('2023-12-15'));

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
