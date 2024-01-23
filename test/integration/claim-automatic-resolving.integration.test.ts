import { Test, TestingModule } from '@nestjs/testing';
import { getConnection } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { AppProperties } from '../../src/config/app-properties.config';
import {
  ClaimCompletionMode,
  ClaimStatus,
} from '../../src/entity/claim.entity';
import { Client, Type } from '../../src/entity/client.entity';
import { Driver } from '../../src/entity/driver.entity';
import { AddressRepository } from '../../src/repository/address.repository';
import { ClientRepository } from '../../src/repository/client.repository';
import { DriverFeeRepository } from '../../src/repository/driver-fee.repository';
import { TransitRepository } from '../../src/repository/transit.repository';
import { AwardsService } from '../../src/service/awards.service';
import { CarTypeService } from '../../src/service/car-type.service';
import { ClaimService } from '../../src/service/claim.service';
import { ClientNotificationService } from '../../src/service/client-notification.service';
import { DriverNotificationService } from '../../src/service/driver-notification.service';
import { DriverService } from '../../src/service/driver.service';
import { Fixtures } from '../common/fixtures';

describe('Claim Automatic Resolving', () => {
  let claimService: ClaimService;
  let appProperties: AppProperties;
  let fixtures: Fixtures;
  let driverService: DriverService;
  let driverFeeRepository: DriverFeeRepository;
  let transitRepository: TransitRepository;
  let addressRepository: AddressRepository;
  let clientRepository: ClientRepository;
  let carTypeService: CarTypeService;
  let awardsService: AwardsService;
  let clientNotificationService: ClientNotificationService;
  let driverNotificationService: DriverNotificationService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    claimService = module.get<ClaimService>(ClaimService);
    appProperties = module.get<AppProperties>(AppProperties);
    driverService = module.get<DriverService>(DriverService);
    driverFeeRepository = module.get<DriverFeeRepository>(DriverFeeRepository);
    transitRepository = module.get<TransitRepository>(TransitRepository);
    addressRepository = module.get<AddressRepository>(AddressRepository);
    clientRepository = module.get<ClientRepository>(ClientRepository);
    carTypeService = module.get<CarTypeService>(CarTypeService);
    awardsService = module.get<AwardsService>(AwardsService);
    clientNotificationService = module.get<ClientNotificationService>(
      ClientNotificationService,
    );
    driverNotificationService = module.get<DriverNotificationService>(
      DriverNotificationService,
    );

    fixtures = new Fixtures(
      driverService,
      driverFeeRepository,
      transitRepository,
      addressRepository,
      clientRepository,
      carTypeService,
      claimService,
      awardsService,
    );
  });

  beforeAll(() => {
    clientNotificationService.notifyClientAboutRefund = jest.fn();
    clientNotificationService.askForMoreInformation = jest.fn();
    awardsService.registerSpecialMiles = jest.fn();
    driverNotificationService.askDriverForDetailsAboutClaim = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await getConnection().close();
  });

  it('Second claim for the same transit will be escalated', async () => {
    lowCostThresholdIs(40);

    const driver = await fixtures.createTestDriver();
    const client = await fixtures.createTestClient(Type.VIP);
    const transit = await aTransit(client, driver, 20);

    let claim = await fixtures.createClaim(client, transit);
    claim = await claimService.tryToResolveAutomatically(claim.getId());

    let claim2 = await fixtures.createClaim(client, transit);
    claim2 = await claimService.tryToResolveAutomatically(claim2.getId());

    expect(claim.getStatus()).toEqual(ClaimStatus.REFUNDED);
    expect(claim.getCompletionMode()).toEqual(ClaimCompletionMode.AUTOMATIC);
    expect(claim2.getStatus()).toEqual(ClaimStatus.ESCALATED);
    expect(claim2.getCompletionMode()).toEqual(ClaimCompletionMode.MANUAL);
  });

  it('Low cost transits are refunded if client is VIP', async () => {
    lowCostThresholdIs(40);

    const client = await fixtures.createClientWithClaims(Type.VIP, 3);
    const driver = await fixtures.createTestDriver();
    const transit = await aTransit(client, driver, 20);

    let claim = await fixtures.createClaim(client, transit);

    claim = await claimService.tryToResolveAutomatically(claim.getId());

    expect(claim.getStatus()).toEqual(ClaimStatus.REFUNDED);
    expect(claim.getCompletionMode()).toEqual(ClaimCompletionMode.AUTOMATIC);
    expect(awardsService.registerSpecialMiles).toHaveBeenCalledWith(
      claim.getOwner().getId(),
      10,
    );
    expect(
      clientNotificationService.notifyClientAboutRefund,
    ).toHaveBeenCalledWith(claim.getClaimNo(), claim.getOwner().getId());
  });

  it('High cost transits are escalated even when client is VIP', async () => {
    lowCostThresholdIs(40);

    const client = await fixtures.createClientWithClaims(Type.VIP, 3);
    const driver = await fixtures.createTestDriver();
    const transit = await aTransit(client, driver, 50);

    let claim = await fixtures.createClaim(client, transit);

    jest.clearAllMocks();
    claim = await claimService.tryToResolveAutomatically(claim.getId());

    expect(claim.getStatus()).toEqual(ClaimStatus.ESCALATED);
    expect(claim.getCompletionMode()).toEqual(ClaimCompletionMode.MANUAL);
    expect(awardsService.registerSpecialMiles).not.toHaveBeenCalled();
    expect(
      driverNotificationService.askDriverForDetailsAboutClaim,
    ).toHaveBeenCalledWith(claim.getClaimNo(), driver.getId());
  });

  it('First three claims are refunded automatically, then manual and escalated', async () => {
    lowCostThresholdIs(40);
    noOfTransitsForAutomaticRefundIs(10);

    const client = await fixtures.createTestClient(Type.NORMAL);
    const driver = await fixtures.createTestDriver();

    const [transit1, transit2, transit3, transit4] = await Promise.all([
      await aTransit(client, driver, 50),
      await aTransit(client, driver, 50),
      await aTransit(client, driver, 50),
      await aTransit(client, driver, 50),
    ]);

    let claim1 = await fixtures.createClaim(client, transit1);
    claim1 = await claimService.tryToResolveAutomatically(claim1.getId());

    let claim2 = await fixtures.createClaim(client, transit2);
    claim2 = await claimService.tryToResolveAutomatically(claim2.getId());

    let claim3 = await fixtures.createClaim(client, transit3);
    claim3 = await claimService.tryToResolveAutomatically(claim3.getId());

    let claim4 = await fixtures.createClaim(client, transit4);
    claim4 = await claimService.tryToResolveAutomatically(claim4.getId());

    expect(claim1.getStatus()).toEqual(ClaimStatus.REFUNDED);
    expect(claim2.getStatus()).toEqual(ClaimStatus.REFUNDED);
    expect(claim3.getStatus()).toEqual(ClaimStatus.REFUNDED);
    expect(claim4.getStatus()).toEqual(ClaimStatus.ESCALATED);

    expect(claim1.getCompletionMode()).toEqual(ClaimCompletionMode.AUTOMATIC);
    expect(claim2.getCompletionMode()).toEqual(ClaimCompletionMode.AUTOMATIC);
    expect(claim3.getCompletionMode()).toEqual(ClaimCompletionMode.AUTOMATIC);
    expect(claim4.getCompletionMode()).toEqual(ClaimCompletionMode.MANUAL);

    expect(
      clientNotificationService.notifyClientAboutRefund,
    ).toHaveBeenNthCalledWith(
      1,
      claim1.getClaimNo(),
      claim1.getOwner().getId(),
    );
    expect(
      clientNotificationService.notifyClientAboutRefund,
    ).toHaveBeenNthCalledWith(
      2,
      claim2.getClaimNo(),
      claim2.getOwner().getId(),
    );
    expect(
      clientNotificationService.notifyClientAboutRefund,
    ).toHaveBeenNthCalledWith(
      3,
      claim3.getClaimNo(),
      claim3.getOwner().getId(),
    );

    expect(awardsService.registerSpecialMiles).not.toHaveBeenCalled();
  });

  it('Low cost transits are refunded when there are many transits done by client', async () => {
    lowCostThresholdIs(40);
    noOfTransitsForAutomaticRefundIs(10);

    const client = await fixtures.createClientWithClaims(Type.NORMAL, 3);

    await fixtures.clientHasDoneTransits(client, 12);

    const transit = await aTransit(
      client,
      await fixtures.createTestDriver(),
      39,
    );

    let claim = await fixtures.createClaim(client, transit);
    claim = await claimService.tryToResolveAutomatically(claim.getId());

    expect(claim.getStatus()).toEqual(ClaimStatus.REFUNDED);
    expect(claim.getCompletionMode()).toEqual(ClaimCompletionMode.AUTOMATIC);
    expect(awardsService.registerSpecialMiles).not.toHaveBeenCalled();
    expect(
      clientNotificationService.notifyClientAboutRefund,
    ).toHaveBeenCalledWith(claim.getClaimNo(), claim.getOwner().getId());
  });

  it('High cost transits are escalated even when there are many transits done by client', async () => {
    lowCostThresholdIs(40);
    noOfTransitsForAutomaticRefundIs(10);

    const client = await fixtures.createClientWithClaims(Type.NORMAL, 3);

    await fixtures.clientHasDoneTransits(client, 12);

    const driver = await fixtures.createTestDriver();
    const transit = await aTransit(client, driver, 50);
    let claim = await fixtures.createClaim(client, transit);
    claim = await claimService.tryToResolveAutomatically(claim.getId());

    expect(claim.getStatus()).toEqual(ClaimStatus.ESCALATED);
    expect(claim.getCompletionMode()).toEqual(ClaimCompletionMode.MANUAL);
    expect(
      clientNotificationService.askForMoreInformation,
    ).toHaveBeenCalledWith(claim.getClaimNo(), claim.getOwner().getId());
    expect(awardsService.registerSpecialMiles).not.toHaveBeenCalled();
  });

  it('High cost transits are escalated even when few transits', async () => {
    lowCostThresholdIs(40);
    noOfTransitsForAutomaticRefundIs(10);

    const client = await fixtures.createClientWithClaims(Type.NORMAL, 3);

    await fixtures.clientHasDoneTransits(client, 2);

    const driver = await fixtures.createTestDriver();
    const transit = await aTransit(client, driver, 50);

    let claim = await fixtures.createClaim(client, transit);
    claim = await claimService.tryToResolveAutomatically(claim.getId());

    expect(claim.getStatus()).toEqual(ClaimStatus.ESCALATED);
    expect(claim.getCompletionMode()).toEqual(ClaimCompletionMode.MANUAL);

    expect(
      driverNotificationService.askDriverForDetailsAboutClaim,
    ).toHaveBeenCalledWith(claim.getClaimNo(), driver.getId());
    expect(awardsService.registerSpecialMiles).not.toHaveBeenCalled();
  });

  function lowCostThresholdIs(price: number) {
    jest
      .spyOn(appProperties, 'getAutomaticRefundForVipThreshold')
      .mockReturnValue(price);
  }

  function noOfTransitsForAutomaticRefundIs(no: number) {
    jest
      .spyOn(appProperties, 'getNoOfTransitsForClaimAutomaticRefund')
      .mockReturnValue(no);
  }

  function aTransit(client: Client, driver: Driver, price: number) {
    return fixtures.createCompletedTransitAt(price, new Date(), client, driver);
  }
});
