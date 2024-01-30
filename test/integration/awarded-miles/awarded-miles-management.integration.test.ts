import { NotAcceptableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getConnection } from 'typeorm';

import { AppModule } from '../../../src/app.module';
import { Money } from '../../../src/money/money';
import { AddressRepository } from '../../../src/repository/address.repository';
import { AwardedMilesRepository } from '../../../src/repository/awarded-miles.repository';
import { ClientRepository } from '../../../src/repository/client.repository';
import { DriverFeeRepository } from '../../../src/repository/driver-fee.repository';
import { TransitRepository } from '../../../src/repository/transit.repository';
import { AwardsService } from '../../../src/service/awards.service';
import { CarTypeService } from '../../../src/service/car-type.service';
import { ClaimService } from '../../../src/service/claim.service';
import { DriverService } from '../../../src/service/driver.service';
import { Fixtures } from '../../common/fixtures';

jest.setTimeout(300000);
describe('Awarded Miles Management', () => {
  let awardsService: AwardsService;
  let clientRepository: ClientRepository;
  let addressRepository: AddressRepository;
  let driverService: DriverService;
  let transitRepository: TransitRepository;
  let awardedMilesRepository: AwardedMilesRepository;
  let claimService: ClaimService;
  let fixtures: Fixtures;

  const NOW = new Date('2020-01-01');

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    awardsService = module.get<AwardsService>(AwardsService);
    clientRepository = module.get<ClientRepository>(ClientRepository);
    driverService = module.get<DriverService>(DriverService);
    claimService = module.get<ClaimService>(ClaimService);
    transitRepository = module.get<TransitRepository>(TransitRepository);
    addressRepository = module.get<AddressRepository>(AddressRepository);
    awardedMilesRepository = module.get<AwardedMilesRepository>(
      AwardedMilesRepository,
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

  it('Can register account to awards program', async () => {
    const client = await fixtures.createTestClient();

    await awardsService.registerToProgram(client.getId());

    const account = await awardsService.findBy(client.getId());

    expect(account).toBeDefined();
    expect(account.getClient().getId()).toEqual(client.getId());
    expect(account.getIsActive()).toBeFalsy();
    expect(account.getTransactions()).toEqual(0);
  });

  it('Can activate account', async () => {
    const client = await fixtures.createTestClient();

    await awardsService.registerToProgram(client.getId());
    await awardsService.activateAccount(client.getId());

    const account = await awardsService.findBy(client.getId());

    expect(account.getIsActive()).toBeTruthy();
  });

  it('Can deactivate account', async () => {
    const client = await fixtures.createTestClient();

    await fixtures.createActiveAwardsAccount(client);

    await awardsService.deactivateAccount(client.getId());

    const account = await awardsService.findBy(client.getId());

    expect(account.getIsActive()).toBeFalsy();
  });

  it('Can register miles', async () => {
    const client = await fixtures.createTestClient();

    await fixtures.createActiveAwardsAccount(client);

    const driver = await fixtures.createTestDriver();
    const transit = await fixtures.createTestTransit(
      driver,
      new Money(80).toInt(),
    );

    await awardsService.registerMiles(client.getId(), transit.getId());

    const account = await awardsService.findBy(client.getId());
    const awardedMiles = await awardedMilesRepository.findAllByClient(client);

    expect(account.getTransactions()).toEqual(1);
    expect(awardedMiles).toHaveLength(1);
    expect(awardedMiles[0].getMilesAmount(NOW)).toEqual(10);
    expect(awardedMiles[0].cantExpire()).toBeFalsy();
  });

  it('Can register non expiring miles', async () => {
    const client = await fixtures.createTestClient();
    await fixtures.createActiveAwardsAccount(client);

    await awardsService.registerNonExpiringMiles(client.getId(), 20);

    const account = await awardsService.findBy(client.getId());
    const awardedMiles = await awardedMilesRepository.findAllByClient(client);

    expect(account.getTransactions()).toEqual(1);
    expect(awardedMiles).toHaveLength(1);
    expect(awardedMiles[0].getMilesAmount(NOW)).toEqual(20);
    expect(awardedMiles[0].cantExpire()).toBeTruthy();
  });

  it('Can calculate miles balance', async () => {
    const client = await fixtures.createTestClient();
    await fixtures.createActiveAwardsAccount(client);
    const driver = await fixtures.createTestDriver();
    const transit = await fixtures.createTestTransit(
      driver,
      new Money(80).toInt(),
    );

    await awardsService.registerNonExpiringMiles(client.getId(), 20);
    await awardsService.registerMiles(client.getId(), transit.getId());
    await awardsService.registerMiles(client.getId(), transit.getId());

    const account = await awardsService.findBy(client.getId());
    const miles = await awardsService.calculateBalance(client.getId());

    expect(account.getTransactions()).toEqual(3);
    expect(miles).toEqual(40);
  });

  it('Can transfer non-expiring miles', async () => {
    const client = await fixtures.createTestClient();
    const secondClient = await fixtures.createTestClient();

    await fixtures.createActiveAwardsAccount(client);
    await fixtures.createActiveAwardsAccount(secondClient);

    await awardsService.registerNonExpiringMiles(client.getId(), 10);
    await awardsService.registerNonExpiringMiles(client.getId(), 10);
    await awardsService.transferMiles(client.getId(), secondClient.getId(), 7);

    const firstClientBalance = await awardsService.calculateBalance(
      client.getId(),
    );
    const secondClientBalance = await awardsService.calculateBalance(
      secondClient.getId(),
    );

    expect(firstClientBalance).toEqual(13);
    expect(secondClientBalance).toEqual(7);
  });

  it('Can transfer expiring miles', async () => {
    const client = await fixtures.createTestClient();
    const secondClient = await fixtures.createTestClient();

    await fixtures.createActiveAwardsAccount(client);
    await fixtures.createActiveAwardsAccount(secondClient);

    const driver = await fixtures.createTestDriver();
    const transit = await fixtures.createTestTransit(
      driver,
      new Money(80).toInt(),
    );

    await awardsService.registerMiles(client.getId(), transit.getId());
    await awardsService.registerMiles(client.getId(), transit.getId());

    await awardsService.transferMiles(client.getId(), secondClient.getId(), 7);

    const firstClientBalance = await awardsService.calculateBalance(
      client.getId(),
    );
    const secondClientBalance = await awardsService.calculateBalance(
      secondClient.getId(),
    );

    expect(firstClientBalance).toEqual(13);
    expect(secondClientBalance).toEqual(7);
  });

  it("Can't transfer miles when account is not active", async () => {
    const client = await fixtures.createTestClient();
    const secondClient = await fixtures.createTestClient();

    await fixtures.createActiveAwardsAccount(client);
    await fixtures.createAwardsAccount(secondClient);

    await awardsService.registerNonExpiringMiles(client.getId(), 10);
    await awardsService.deactivateAccount(client.getId());

    await awardsService.transferMiles(client.getId(), secondClient.getId(), 10);

    const firstClientBalance = await awardsService.calculateBalance(
      client.getId(),
    );
    const secondClientBalance = await awardsService.calculateBalance(
      secondClient.getId(),
    );

    expect(firstClientBalance).toEqual(10);
    expect(secondClientBalance).toEqual(0);
  });

  it("Can't transfer miles when not enough", async () => {
    const client = await fixtures.createTestClient();
    const secondClient = await fixtures.createTestClient();

    await fixtures.createActiveAwardsAccount(client);
    await fixtures.createActiveAwardsAccount(secondClient);

    await awardsService.registerNonExpiringMiles(client.getId(), 10);

    await awardsService.transferMiles(client.getId(), secondClient.getId(), 30);

    const firstClientBalance = await awardsService.calculateBalance(
      client.getId(),
    );
    const secondClientBalance = await awardsService.calculateBalance(
      secondClient.getId(),
    );

    expect(firstClientBalance).toEqual(10);
    expect(secondClientBalance).toEqual(0);
  });

  it('Can remove miles', async () => {
    const client = await fixtures.createTestClient();

    await fixtures.createActiveAwardsAccount(client);

    const driver = await fixtures.createTestDriver();
    const transit = await fixtures.createTestTransit(
      driver,
      new Money(80).toInt(),
    );

    await awardsService.registerMiles(client.getId(), transit.getId());
    await awardsService.registerMiles(client.getId(), transit.getId());
    await awardsService.registerMiles(client.getId(), transit.getId());

    await awardsService.removeMiles(client.getId(), 20);

    const miles = await awardsService.calculateBalance(client.getId());

    expect(miles).toEqual(10);
  });

  it("Can't remove more miles than client has", async () => {
    const client = await fixtures.createTestClient();

    await fixtures.createActiveAwardsAccount(client);

    const driver = await fixtures.createTestDriver();
    const transit = await fixtures.createTestTransit(
      driver,
      new Money(80).toInt(),
    );

    await awardsService.registerMiles(client.getId(), transit.getId());
    await awardsService.registerMiles(client.getId(), transit.getId());
    await awardsService.registerMiles(client.getId(), transit.getId());

    await expect(
      awardsService.removeMiles(client.getId(), 40),
    ).rejects.toThrowError(NotAcceptableException);
  });

  it("Can't remove miles if account is not active", async () => {
    const client = await fixtures.createTestClient();

    await awardsService.registerToProgram(client.getId());

    const driver = await fixtures.createTestDriver();
    const transit = await fixtures.createTestTransit(
      driver,
      new Money(80).toInt(),
    );

    const currentMiles = await awardsService.calculateBalance(client.getId());

    await awardsService.registerMiles(client.getId(), transit.getId());

    expect(await awardsService.calculateBalance(client.getId())).toEqual(
      currentMiles,
    );
  });
});
