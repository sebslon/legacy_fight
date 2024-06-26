import { Test, TestingModule } from '@nestjs/testing';
import { getConnection } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { AppModule } from '../../../src/app.module';
import { Clock } from '../../../src/common/clock';
import { AppProperties } from '../../../src/config/app-properties.config';
import { Client, Type } from '../../../src/crm/client.entity';
import { AwardedMiles } from '../../../src/loyalty/awarded-miles.entity';
import { AwardsAccountRepository } from '../../../src/loyalty/awards-account.repository';
import { AwardsService } from '../../../src/loyalty/awards.service';
import { Fixtures } from '../../common/fixtures';

jest.setTimeout(3000000);
describe('Removing Awarded Miles', () => {
  const TRANSIT_ID = uuid();

  const DAY_BEFORE_YESTERDAY = Date.now() - 2 * 24 * 60 * 60 * 1000;
  const YESTERDAY = Date.now() - 24 * 60 * 60 * 1000;
  const TODAY = Date.now();
  const SUNDAY = new Date('2024-01-28T00:00:00.000Z');

  let awardsService: AwardsService;
  let appProperties: AppProperties;
  let awardsAccountRepository: AwardsAccountRepository;
  let fixtures: Fixtures;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AppProperties)
      .useValue(new AppProperties())
      .compile();

    awardsService = module.get<AwardsService>(AwardsService);
    appProperties = module.get<AppProperties>(AppProperties);
    awardsAccountRepository = module.get<AwardsAccountRepository>(
      AwardsAccountRepository,
    );

    fixtures = module.get<Fixtures>(Fixtures);
  });

  afterAll(async () => {
    await getConnection().close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('By default removes oldest miles even when they are special', async () => {
    const client = await clientWithAnActiveMilesProgram(Type.NORMAL);

    const newestMiles = await grantedMilesThatWillExpireInDays(
      10,
      365,
      new Date(TODAY),
      client,
    );
    const middleMiles = await grantedMilesThatWillExpireInDays(
      10,
      365,
      new Date(YESTERDAY),
      client,
    );
    const oldestSpecialMiles = await grantedSpecialMiles(
      5,
      new Date(DAY_BEFORE_YESTERDAY),
      client,
    );

    await awardsService.removeMiles(client.getId(), 16);

    const totalMiles = await awardsAccountRepository.findAllMilesByClient(
      client,
    );

    assertThatMilesWereReducedTo(oldestSpecialMiles, 0, totalMiles);
    assertThatMilesWereReducedTo(middleMiles as AwardedMiles, 0, totalMiles);
    assertThatMilesWereReducedTo(newestMiles as AwardedMiles, 9, totalMiles);
  });

  it('Should remove oldest miles first when many transits', async () => {
    const client = await clientWithAnActiveMilesProgram(Type.NORMAL);
    await fixtures.clientHasDoneTransits(client, 15);

    const oldest = await grantedMilesThatWillExpireInDays(
      10,
      60,
      new Date(DAY_BEFORE_YESTERDAY),
      client,
    );
    const middle = await grantedMilesThatWillExpireInDays(
      10,
      365,
      new Date(YESTERDAY),
      client,
    );
    const newest = await grantedMilesThatWillExpireInDays(
      10,
      30,
      new Date(TODAY),
      client,
    );

    isNotSunday();
    await awardsService.removeMiles(client.getId(), 15);

    const totalMiles = await awardsAccountRepository.findAllMilesByClient(
      client,
    );

    assertThatMilesWereReducedTo(oldest as AwardedMiles, 0, totalMiles);
    assertThatMilesWereReducedTo(middle as AwardedMiles, 5, totalMiles);
    assertThatMilesWereReducedTo(newest as AwardedMiles, 10, totalMiles);
  });

  it('Should remove special miles last when many transits', async () => {
    const client = await clientWithAnActiveMilesProgram(Type.NORMAL);

    await fixtures.clientHasDoneTransits(client, 15);

    const regularMiles = await grantedMilesThatWillExpireInDays(
      10,
      365,
      new Date(TODAY),
      client,
    );
    const olderSpecialMiles = await grantedSpecialMiles(
      5,
      new Date(DAY_BEFORE_YESTERDAY),
      client,
    );

    await awardsService.removeMiles(client.getId(), 13);

    const totalMiles = await awardsAccountRepository.findAllMilesByClient(
      client,
    );

    assertThatMilesWereReducedTo(regularMiles as AwardedMiles, 0, totalMiles);
    assertThatMilesWereReducedTo(olderSpecialMiles, 2, totalMiles);
  });

  it('Should remove soon to expire miles first when client is VIP', async () => {
    const client = await clientWithAnActiveMilesProgram(Type.VIP);

    const firstToExpire = await grantedMilesThatWillExpireInDays(
      15,
      30,
      new Date(TODAY),
      client,
    );
    const secondToExpire = await grantedMilesThatWillExpireInDays(
      10,
      60,
      new Date(YESTERDAY),
      client,
    );
    const thirdToExpire = await grantedMilesThatWillExpireInDays(
      5,
      365,
      new Date(DAY_BEFORE_YESTERDAY),
      client,
    );
    const specialMiles = await grantedSpecialMiles(
      1,
      new Date(DAY_BEFORE_YESTERDAY),
      client,
    );

    await awardsService.removeMiles(client.getId(), 21);

    const totalMiles = await awardsAccountRepository.findAllMilesByClient(
      client,
    );

    assertThatMilesWereReducedTo(specialMiles, 1, totalMiles);
    assertThatMilesWereReducedTo(firstToExpire as AwardedMiles, 0, totalMiles);
    assertThatMilesWereReducedTo(secondToExpire as AwardedMiles, 4, totalMiles);
    assertThatMilesWereReducedTo(thirdToExpire as AwardedMiles, 5, totalMiles);
  });

  it('Should remove soon to expire miles first when removing on sunday and client has done many transits', async () => {
    const client = await clientWithAnActiveMilesProgram(Type.NORMAL);

    await fixtures.clientHasDoneTransits(client, 15);

    const firstToExpire = await grantedMilesThatWillExpireInDays(
      15,
      10,
      new Date(TODAY),
      client,
    );
    const secondToExpire = await grantedMilesThatWillExpireInDays(
      10,
      60,
      new Date(YESTERDAY),
      client,
    );
    const thirdToExpire = await grantedMilesThatWillExpireInDays(
      5,
      365,
      new Date(DAY_BEFORE_YESTERDAY),
      client,
    );
    const specialMiles = await grantedSpecialMiles(
      100,
      new Date(YESTERDAY),
      client,
    );

    itIsSunday();
    await awardsService.removeMiles(client.getId(), 21);

    const totalMiles = await awardsAccountRepository.findAllMilesByClient(
      client,
    );

    assertThatMilesWereReducedTo(specialMiles as AwardedMiles, 100, totalMiles);
    assertThatMilesWereReducedTo(firstToExpire as AwardedMiles, 0, totalMiles);
    assertThatMilesWereReducedTo(secondToExpire as AwardedMiles, 4, totalMiles);
    assertThatMilesWereReducedTo(thirdToExpire as AwardedMiles, 5, totalMiles);
  });

  it('Should remove (also special) soon to expire miles first when client has many claims', async () => {
    const client = await clientWithAnActiveMilesProgram(Type.NORMAL);
    await fixtures.clientHasDoneClaims(client, 3);

    const firstToExpire = await grantedMilesThatWillExpireInDays(
      5,
      10,
      new Date(YESTERDAY),
      client,
    );
    const secondToExpire = await grantedMilesThatWillExpireInDays(
      4,
      60,
      new Date(YESTERDAY),
      client,
    );
    const thirdToExpire = await grantedMilesThatWillExpireInDays(
      10,
      365,
      new Date(DAY_BEFORE_YESTERDAY),
      client,
    );
    const specialMiles = await grantedSpecialMiles(
      10,
      new Date(YESTERDAY),
      client,
    );

    await awardsService.removeMiles(client.getId(), 21);

    const totalMiles = await awardsAccountRepository.findAllMilesByClient(
      client,
    );

    assertThatMilesWereReducedTo(specialMiles, 0, totalMiles);
    assertThatMilesWereReducedTo(thirdToExpire as AwardedMiles, 0, totalMiles);
    assertThatMilesWereReducedTo(secondToExpire as AwardedMiles, 3, totalMiles);
    assertThatMilesWereReducedTo(firstToExpire as AwardedMiles, 5, totalMiles);
  });

  // Helper Functions

  function assertThatMilesWereReducedTo(
    milesToExpire: AwardedMiles,
    milesAfterReduction: number,
    allMiles: AwardedMiles[] | readonly AwardedMiles[],
  ) {
    const awardedMiles = allMiles.filter(
      (am) => milesToExpire && milesToExpire.getId() === am.getId(),
    );

    const miles = awardedMiles.map((am) =>
      am.getMiles().getAmountFor(new Date()),
    );
    const actual = miles.reduce((a, b) => a + b, 0);

    expect(actual).toBe(milesAfterReduction);
  }

  async function clientWithAnActiveMilesProgram(type: Type) {
    jest.spyOn(Date, 'now').mockReturnValueOnce(DAY_BEFORE_YESTERDAY);

    const client = await fixtures.createTestClient(type);

    await fixtures.createActiveAwardsAccount(client);

    return client;
  }

  async function grantedMilesThatWillExpireInDays(
    miles: number,
    expirationInDays: number,
    whenRegistered: Date,
    client: Client,
  ) {
    milesWillExpireInDays(expirationInDays);
    defaultMilesBonusIs(miles);
    return milesRegisteredAt(whenRegistered, client);
  }

  async function milesRegisteredAt(when: Date, client: Client) {
    jest.spyOn(Clock, 'currentDate').mockReturnValue(when);

    return await awardsService.registerMiles(client.getId(), TRANSIT_ID);
  }

  async function grantedSpecialMiles(
    miles: number,
    when: Date,
    client: Client,
  ) {
    defaultMilesBonusIs(miles);
    jest.spyOn(Date, 'now').mockReturnValue(when.getTime());

    return awardsService.registerNonExpiringMiles(client.getId(), miles);
  }

  function milesWillExpireInDays(days: number) {
    jest.spyOn(appProperties, 'getMilesExpirationInDays').mockReturnValue(days);
  }

  function defaultMilesBonusIs(miles: number) {
    jest.spyOn(appProperties, 'getDefaultMilesBonus').mockReturnValue(miles);
  }

  function itIsSunday() {
    jest.spyOn(Date, 'now').mockReturnValue(SUNDAY.getTime());
    jest.spyOn(Clock, 'currentDate').mockReturnValue(SUNDAY);
  }

  function isNotSunday() {
    jest
      .spyOn(Clock, 'currentDate')
      .mockReturnValue(new Date('2024-02-07T12:00:00.000Z'));
  }
});
