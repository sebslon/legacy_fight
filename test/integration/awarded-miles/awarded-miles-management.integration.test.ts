import { NotAcceptableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getConnection } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { AppModule } from '../../../src/app.module';
import { AwardsAccountRepository } from '../../../src/repository/awards-account.repository';
import { AwardsService } from '../../../src/service/awards.service';
import { Fixtures } from '../../common/fixtures';

describe('Awarded Miles Management', () => {
  let awardsService: AwardsService;
  let awardsAccountRepository: AwardsAccountRepository;
  let fixtures: Fixtures;

  const NOW = new Date('2020-01-01');
  const TRANSIT_ID = uuid();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    awardsService = module.get<AwardsService>(AwardsService);
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

    await awardsService.registerMiles(client.getId(), TRANSIT_ID);

    const account = await awardsService.findBy(client.getId());
    const awardedMiles = await awardsAccountRepository.findAllMilesByClient(
      client,
    );

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
    const awardedMiles = await awardsAccountRepository.findAllMilesByClient(
      client,
    );

    expect(account.getTransactions()).toEqual(1);
    expect(awardedMiles).toHaveLength(1);
    expect(awardedMiles[0].getMilesAmount(NOW)).toEqual(20);
    expect(awardedMiles[0].cantExpire()).toBeTruthy();
  });

  it('Can calculate miles balance', async () => {
    const client = await fixtures.createTestClient();
    await fixtures.createActiveAwardsAccount(client);

    await awardsService.registerNonExpiringMiles(client.getId(), 20);
    await awardsService.registerMiles(client.getId(), TRANSIT_ID);
    await awardsService.registerMiles(client.getId(), TRANSIT_ID);

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

    await awardsService.registerMiles(client.getId(), TRANSIT_ID);
    await awardsService.registerMiles(client.getId(), TRANSIT_ID);

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

    await awardsService.registerMiles(client.getId(), TRANSIT_ID);
    await awardsService.registerMiles(client.getId(), TRANSIT_ID);
    await awardsService.registerMiles(client.getId(), TRANSIT_ID);

    await awardsService.removeMiles(client.getId(), 20);

    const miles = await awardsService.calculateBalance(client.getId());

    expect(miles).toEqual(10);
  });

  it("Can't remove more miles than client has", async () => {
    const client = await fixtures.createTestClient();

    await fixtures.createActiveAwardsAccount(client);

    await awardsService.registerMiles(client.getId(), TRANSIT_ID);
    await awardsService.registerMiles(client.getId(), TRANSIT_ID);
    await awardsService.registerMiles(client.getId(), TRANSIT_ID);

    await expect(
      awardsService.removeMiles(client.getId(), 40),
    ).rejects.toThrowError(NotAcceptableException);
  });

  it("Can't remove miles if account is not active", async () => {
    const client = await fixtures.createTestClient();

    await awardsService.registerToProgram(client.getId());

    const currentMiles = await awardsService.calculateBalance(client.getId());

    await awardsService.registerMiles(client.getId(), TRANSIT_ID);

    expect(await awardsService.calculateBalance(client.getId())).toEqual(
      currentMiles,
    );
  });
});
