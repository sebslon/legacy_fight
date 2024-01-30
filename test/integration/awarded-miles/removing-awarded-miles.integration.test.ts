import { Test, TestingModule } from '@nestjs/testing';
import { getConnection } from 'typeorm';

import { AppModule } from '../../../src/app.module';
import { Clock } from '../../../src/common/clock';
import { AppProperties } from '../../../src/config/app-properties.config';
import { Client, Type } from '../../../src/entity/client.entity';
import { Transit } from '../../../src/entity/transit.entity';
import { AwardedMiles } from '../../../src/miles/awarded-miles.entity';
import { Money } from '../../../src/money/money';
import { AddressRepository } from '../../../src/repository/address.repository';
import { AwardsAccountRepository } from '../../../src/repository/awards-account.repository';
import { ClientRepository } from '../../../src/repository/client.repository';
import { DriverFeeRepository } from '../../../src/repository/driver-fee.repository';
import { TransitRepository } from '../../../src/repository/transit.repository';
import { AwardsService } from '../../../src/service/awards.service';
import { CarTypeService } from '../../../src/service/car-type.service';
import { ClaimService } from '../../../src/service/claim.service';
import { DriverService } from '../../../src/service/driver.service';
import { Fixtures } from '../../common/fixtures';

describe('Removing Awarded Miles', () => {
  const DAY_BEFORE_YESTERDAY = Date.now() - 2 * 24 * 60 * 60 * 1000;
  const YESTERDAY = Date.now() - 24 * 60 * 60 * 1000;
  const TODAY = Date.now();
  const SUNDAY = new Date('2024-01-28T00:00:00.000Z');

  let awardsService: AwardsService;
  let appProperties: AppProperties;
  let awardsAccountRepository: AwardsAccountRepository;
  let clientRepository: ClientRepository;
  let addressRepository: AddressRepository;
  let driverService: DriverService;
  let transitRepository: TransitRepository;
  let claimService: ClaimService;
  let fixtures: Fixtures;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    awardsService = module.get<AwardsService>(AwardsService);
    appProperties = module.get<AppProperties>(AppProperties);
    clientRepository = module.get<ClientRepository>(ClientRepository);
    driverService = module.get<DriverService>(DriverService);
    claimService = module.get<ClaimService>(ClaimService);
    transitRepository = module.get<TransitRepository>(TransitRepository);
    addressRepository = module.get<AddressRepository>(AddressRepository);
    awardsAccountRepository = module.get<AwardsAccountRepository>(
      AwardsAccountRepository,
    );

    fixtures = new Fixtures(
      driverService,
      {} as DriverFeeRepository,
      transitRepository,
      addressRepository,
      clientRepository,
      {} as CarTypeService,
      claimService,
      awardsService,
    );
  });

  afterAll(async () => {
    await getConnection().close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('By default removes oldest miles even when they are special', async () => {
    const client = await clientWithAnActiveMilesProgram(Type.NORMAL);
    const driver = await fixtures.createTestDriver();
    const transit = await fixtures.createTestTransit(
      driver,
      new Money(80).toInt(),
    );

    const newestMiles = await grantedMilesThatWillExpireInDays(
      10,
      365,
      new Date(TODAY),
      client,
      transit,
    );
    const middleMiles = await grantedMilesThatWillExpireInDays(
      10,
      365,
      new Date(YESTERDAY),
      client,
      transit,
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

    const driver = await fixtures.createTestDriver();
    const transit = await fixtures.createTestTransit(
      driver,
      new Money(80).toInt(),
    );

    const oldest = await grantedMilesThatWillExpireInDays(
      10,
      60,
      new Date(DAY_BEFORE_YESTERDAY),
      client,
      transit,
    );
    const middle = await grantedMilesThatWillExpireInDays(
      10,
      365,
      new Date(YESTERDAY),
      client,
      transit,
    );
    const newest = await grantedMilesThatWillExpireInDays(
      10,
      30,
      new Date(TODAY),
      client,
      transit,
    );

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

    const driver = await fixtures.createTestDriver();
    const transit = await fixtures.createTestTransit(
      driver,
      new Money(80).toInt(),
    );

    const regularMiles = await grantedMilesThatWillExpireInDays(
      10,
      365,
      new Date(TODAY),
      client,
      transit,
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
    const driver = await fixtures.createTestDriver();
    const transit = await fixtures.createTestTransit(
      driver,
      new Money(80).toInt(),
    );

    const firstToExpire = await grantedMilesThatWillExpireInDays(
      15,
      30,
      new Date(TODAY),
      client,
      transit,
    );
    const secondToExpire = await grantedMilesThatWillExpireInDays(
      10,
      60,
      new Date(YESTERDAY),
      client,
      transit,
    );
    const thirdToExpire = await grantedMilesThatWillExpireInDays(
      5,
      365,
      new Date(DAY_BEFORE_YESTERDAY),
      client,
      transit,
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

    const driver = await fixtures.createTestDriver();
    const transit = await fixtures.createTestTransit(
      driver,
      new Money(80).toInt(),
    );

    const firstToExpire = await grantedMilesThatWillExpireInDays(
      15,
      10,
      new Date(TODAY),
      client,
      transit,
    );
    const secondToExpire = await grantedMilesThatWillExpireInDays(
      10,
      60,
      new Date(YESTERDAY),
      client,
      transit,
    );
    const thirdToExpire = await grantedMilesThatWillExpireInDays(
      5,
      365,
      new Date(DAY_BEFORE_YESTERDAY),
      client,
      transit,
    );
    const specialMiles = await grantedSpecialMiles(
      100,
      new Date(YESTERDAY),
      client,
    );

    // When
    itIsSunday();
    await awardsService.removeMiles(client.getId(), 21);

    // Then
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
    const transit = await fixtures.createTestTransit(
      await fixtures.createTestDriver(),
      new Money(80).toInt(),
    );

    const firstToExpire = await grantedMilesThatWillExpireInDays(
      5,
      10,
      new Date(YESTERDAY),
      client,
      transit,
    );
    const secondToExpire = await grantedMilesThatWillExpireInDays(
      4,
      60,
      new Date(YESTERDAY),
      client,
      transit,
    );
    const thirdToExpire = await grantedMilesThatWillExpireInDays(
      10,
      365,
      new Date(DAY_BEFORE_YESTERDAY),
      client,
      transit,
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
    transit: Transit,
  ) {
    milesWillExpireInDays(expirationInDays);
    defaultMilesBonusIs(miles);
    return milesRegisteredAt(whenRegistered, client, transit);
  }

  async function milesRegisteredAt(
    when: Date,
    client: Client,
    transit: Transit,
  ) {
    jest.spyOn(Clock, 'currentDate').mockReturnValue(when);

    return await awardsService.registerMiles(client.getId(), transit.getId());
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
    jest.spyOn(Clock, 'currentDate').mockReturnValue(SUNDAY);
  }
});
