import { Test, TestingModule } from '@nestjs/testing';
import * as dayjs from 'dayjs';
import { getConnection } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { AppModule } from '../../../src/app.module';
import { Clock } from '../../../src/common/clock';
import { AppProperties } from '../../../src/config/app-properties.config';
import { Distance } from '../../../src/distance/distance';
import { Client } from '../../../src/entity/client.entity';
import { Transit } from '../../../src/entity/transit/transit.entity';
import { TransitRepository } from '../../../src/repository/transit.repository';
import { AwardsService } from '../../../src/service/awards.service';
import { Fixtures } from '../../common/fixtures';

describe('Expiring Awarded Miles (calculating balance)', () => {
  const TRANSIT_ID = uuid();

  const _2000_01_01 = new Date('2000-01-01');
  const _2000_01_02 = new Date('2000-01-02');
  const _2000_01_03 = new Date('2000-01-03');

  let awardsService: AwardsService;
  let appProperties: AppProperties;
  let transitRepository: TransitRepository;
  let fixtures: Fixtures;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    awardsService = module.get<AwardsService>(AwardsService);
    appProperties = module.get<AppProperties>(AppProperties);
    transitRepository = module.get<TransitRepository>(TransitRepository);

    fixtures = module.get<Fixtures>(Fixtures);

    const fakeTransit = Transit.create(new Date(), Distance.ZERO);
    jest.spyOn(transitRepository, 'findOne').mockResolvedValue(fakeTransit);
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

    await registerMilesAt(client, _2000_01_01);
    expect(await calculateBalanceAt(client, _2000_01_01)).toEqual(10);

    await registerMilesAt(client, _2000_01_02);
    expect(await calculateBalanceAt(client, _2000_01_02)).toEqual(20);

    await registerMilesAt(client, _2000_01_03);
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

  function registerMilesAt(client: Client, date: Date) {
    jest.spyOn(Clock, 'currentDate').mockReturnValue(date);

    return awardsService.registerMiles(client.getId(), TRANSIT_ID);
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
