import { Test, TestingModule } from '@nestjs/testing';
import * as dayjs from 'dayjs';
import { getConnection } from 'typeorm';

import { AppModule } from '../../../src/app.module';
import { Clock } from '../../../src/common/clock';
import { AppProperties } from '../../../src/config/app-properties.config';
import { Client } from '../../../src/entity/client.entity';
import { Transit } from '../../../src/entity/transit/transit.entity';
import { Money } from '../../../src/money/money';
import { AddressRepository } from '../../../src/repository/address.repository';
import { ClientRepository } from '../../../src/repository/client.repository';
import { DriverAttributeRepository } from '../../../src/repository/driver-attribute.repository';
import { DriverFeeRepository } from '../../../src/repository/driver-fee.repository';
import { TransitRepository } from '../../../src/repository/transit.repository';
import { AwardsService } from '../../../src/service/awards.service';
import { CarTypeService } from '../../../src/service/car-type.service';
import { ClaimService } from '../../../src/service/claim.service';
import { DriverSessionService } from '../../../src/service/driver-session.service';
import { DriverTrackingService } from '../../../src/service/driver-tracking.service';
import { DriverService } from '../../../src/service/driver.service';
import { TransitService } from '../../../src/service/transit.service';
import { TransitDetailsFacade } from '../../../src/transit-details/transit-details.facade';
import { Fixtures } from '../../common/fixtures';

describe('Expiring Awarded Miles (calculating balance)', () => {
  const _2000_01_01 = new Date('2000-01-01');
  const _2000_01_02 = new Date('2000-01-02');
  const _2000_01_03 = new Date('2000-01-03');

  let awardsService: AwardsService;
  let clientRepository: ClientRepository;
  let addressRepository: AddressRepository;
  let driverService: DriverService;
  let transitRepository: TransitRepository;
  let claimService: ClaimService;
  let appProperties: AppProperties;
  let fixtures: Fixtures;
  let transitDetailsFacade: TransitDetailsFacade;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    awardsService = module.get<AwardsService>(AwardsService);
    clientRepository = module.get<ClientRepository>(ClientRepository);
    driverService = module.get<DriverService>(DriverService);
    claimService = module.get<ClaimService>(ClaimService);
    transitRepository = module.get<TransitRepository>(TransitRepository);
    appProperties = module.get<AppProperties>(AppProperties);
    addressRepository = module.get<AddressRepository>(AddressRepository);
    transitDetailsFacade =
      module.get<TransitDetailsFacade>(TransitDetailsFacade);

    fixtures = new Fixtures(
      transitDetailsFacade,
      driverService,
      {} as DriverFeeRepository,
      transitRepository,
      addressRepository,
      clientRepository,
      {} as CarTypeService,
      claimService,
      awardsService,
      {} as DriverAttributeRepository,
      {} as TransitService,
      {} as DriverSessionService,
      {} as DriverTrackingService,
    );
  });

  afterAll(async () => {
    await getConnection().close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should not take into account expired miles when calculating balance', async () => {
    const client = await fixtures.createTestClient();

    jest.spyOn(Date, 'now').mockImplementation(() => _2000_01_01.getTime());

    defaultMilesBonusIs(10);
    defaultMilesExpirationInDaysIs(365);

    await fixtures.createActiveAwardsAccount(client);

    const driver = await fixtures.createTestDriver();
    const transit = await fixtures.createTestTransit(
      driver,
      new Money(80).toInt(),
    );

    await registerMilesAt(transit, client, _2000_01_01);
    expect(await calculateBalanceAt(client, _2000_01_01)).toEqual(10);

    await registerMilesAt(transit, client, _2000_01_02);
    expect(await calculateBalanceAt(client, _2000_01_02)).toEqual(20);

    await registerMilesAt(transit, client, _2000_01_03);
    expect(await calculateBalanceAt(client, _2000_01_03)).toEqual(30);

    const after300Days = dayjs(_2000_01_01).add(300, 'day').toDate();
    const afterFirstMilesExpire = dayjs(_2000_01_01).add(365, 'day').toDate();
    const afterSecondMilesExpire = dayjs(_2000_01_02).add(365, 'day').toDate();
    const afterThirdMilesExpire = dayjs(_2000_01_03).add(365, 'day').toDate();

    expect(await calculateBalanceAt(client, after300Days)).toEqual(30);
    expect(await calculateBalanceAt(client, afterFirstMilesExpire)).toEqual(20);
    expect(await calculateBalanceAt(client, afterSecondMilesExpire)).toEqual(
      10,
    );
    expect(await calculateBalanceAt(client, afterThirdMilesExpire)).toEqual(0);
  });

  // Helper functions

  function registerMilesAt(transit: Transit, client: Client, date: Date) {
    jest.spyOn(Clock, 'currentDate').mockReturnValue(date);

    return awardsService.registerMiles(client.getId(), transit.getId());
  }

  function calculateBalanceAt(client: Client, date: Date) {
    jest.spyOn(Clock, 'currentDate').mockReturnValue(date);

    return awardsService.calculateBalance(client.getId());
  }

  function defaultMilesBonusIs(milesBonus: number) {
    jest
      .spyOn(appProperties, 'getDefaultMilesBonus')
      .mockReturnValue(milesBonus);
  }

  function defaultMilesExpirationInDaysIs(days: number) {
    jest.spyOn(appProperties, 'getMilesExpirationInDays').mockReturnValue(days);
  }
});
