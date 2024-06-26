import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

import { CarClass } from '../../src/car-fleet/car-class.enum';
import { CarTypeDTO } from '../../src/car-fleet/car-type.dto';
import { CarType } from '../../src/car-fleet/car-type.entity';
import { CarTypeService } from '../../src/car-fleet/car-type.service';
import { Clock } from '../../src/common/clock';
import { ClaimDTO } from '../../src/crm/claims/claim.dto';
import { ClaimService } from '../../src/crm/claims/claim.service';
import { ClientDTO } from '../../src/crm/client.dto';
import {
  Client,
  ClientType,
  PaymentType,
  Type,
} from '../../src/crm/client.entity';
import { ClientRepository } from '../../src/crm/client.repository';
import { DriverAttributeName } from '../../src/driver-fleet/driver-attribute-name.enum';
import { DriverAttribute } from '../../src/driver-fleet/driver-attribute.entity';
import { DriverAttributeRepository } from '../../src/driver-fleet/driver-attribute.repository';
import { DriverFee, FeeType } from '../../src/driver-fleet/driver-fee.entity';
import { DriverFeeRepository } from '../../src/driver-fleet/driver-fee.repository';
import {
  Driver,
  DriverStatus,
  DriverType,
} from '../../src/driver-fleet/driver.entity';
import { DriverService } from '../../src/driver-fleet/driver.service';
import { AddressDTO } from '../../src/geolocation/address/address.dto';
import { Address } from '../../src/geolocation/address/address.entity';
import { AddressRepository } from '../../src/geolocation/address/address.repository';
import { Distance } from '../../src/geolocation/distance';
import { AwardsService } from '../../src/loyalty/awards.service';
import { Money } from '../../src/money/money';
import { Tariff } from '../../src/pricing/tariff';
import { Tariffs } from '../../src/pricing/tariffs';
import { RideService } from '../../src/ride/ride.service';
import { TransitDetailsFacade } from '../../src/ride/transit-details/transit-details.facade';
import { TransitDTO } from '../../src/ride/transit.dto';
import { Transit, TransitStatus } from '../../src/ride/transit.entity';
import { TransitRepository } from '../../src/ride/transit.repository';
import { DriverSessionService } from '../../src/tracking/driver-session.service';
import { DriverTrackingService } from '../../src/tracking/driver-tracking.service';

// TODO: refactor with module (to be composed with specific fixtures instead of single big class)

@Injectable()
export class Fixtures {
  constructor(
    private readonly transitDetailsFacade: TransitDetailsFacade,
    private readonly driverService: DriverService,
    private readonly driverFeeRepository: DriverFeeRepository,
    private readonly transitRepository: TransitRepository,
    private readonly addressRepository: AddressRepository,
    private readonly clientRepository: ClientRepository,
    private readonly carTypeService: CarTypeService,
    private readonly claimService: ClaimService,
    private readonly awardsService: AwardsService,
    private readonly driverAttributeRepository: DriverAttributeRepository,
    private readonly rideService: RideService,
    private readonly driverSessionService: DriverSessionService,
    private readonly driverTrackingService: DriverTrackingService,
  ) {}

  public createTestDriver(
    status?: DriverStatus,
    firstName?: string,
    lastName?: string,
    driverLicense?: string,
  ) {
    return this.driverService.createDriver({
      firstName: firstName ?? 'Test',
      lastName: lastName ?? 'Driver',
      driverLicense: driverLicense ?? 'FARME100165AB5EW',
      type: DriverType.REGULAR,
      status: status ?? DriverStatus.ACTIVE,
      photo: Buffer.from('test', 'utf-8').toString('base64'),
    });
  }

  public async createNearbyDriver(
    plateNumber: string,
    carClass?: CarClass,
    location: { lat: number; lng: number } = { lat: 1, lng: 1 },
  ) {
    const driver = await this.createTestDriver();

    await this.driverHasFee(driver, FeeType.FLAT, 10, 0);

    await this.driverSessionService.logIn(
      driver.getId(),
      plateNumber,
      carClass ?? CarClass.REGULAR,
      'BRAND',
    );
    await this.driverTrackingService.registerPosition(
      driver.getId(),
      location.lat,
      location.lng,
      Clock.currentDate(),
    );

    return driver;
  }

  public async createTransitDetails(
    driver: Driver,
    price: number,
    when: Date = Clock.currentDate(),
    client: Client = new Client(Type.NORMAL),
    from: Address = new Address(
      'Polska',
      'Warszawa',
      '00-001',
      'ul. Testowa',
      1,
    ),
    to: Address = new Address(
      'Polska',
      'Warszawa',
      '00-001',
      'ul. Testowa',
      150,
    ),
  ) {
    const transit = await this.transitRepository.save(
      new Transit(
        TransitStatus.DRAFT,
        Tariff.ofTime(Clock.currentDate()),
        uuid(),
      ),
    );

    await this.stubTransitPrice(new Money(price));

    await this.transitDetailsFacade.transitRequested(
      when,
      transit.getRequestUUID(),
      from,
      to,
      Distance.fromKm(20),
      client,
      CarClass.REGULAR,
      new Money(price),
      Tariff.ofTime(when),
    );

    await this.transitDetailsFacade.transitAccepted(
      transit.getRequestUUID(),
      driver.getId(),
      when,
    );
    await this.transitDetailsFacade.transitStarted(
      transit.getRequestUUID(),
      transit.getId(),
      when,
    );
    await this.transitDetailsFacade.transitCompleted(
      transit.getRequestUUID(),
      when,
      new Money(price),
      new Money(0),
    );

    return transit;
  }

  private async createOrGetAddress(address: Address | undefined) {
    if (!address) {
      const address = new Address(
        'Polska',
        'Warszawa',
        '00-001',
        'ul. Testowa',
        1,
      );

      const addressByHash = await this.addressRepository.findOne({
        where: { hash: address.getHash() },
      });

      if (addressByHash) {
        return addressByHash;
      }

      return this.addressRepository.save(address);
    }

    const addressByHash = await this.addressRepository.findOne({
      where: { hash: address.getHash() },
    });

    if (addressByHash) {
      return addressByHash;
    }

    return this.addressRepository.save(address);
  }

  public async createCompletedTransitAt(
    price: number,
    date: Date,
    client?: Client,
    driver?: Driver,
  ) {
    const toAddress = await this.createOrGetAddress(
      new Address('Polska', 'Warszawa', '00-001', 'ul. Testowa', 1),
    );
    const fromAddress = await this.createOrGetAddress(
      new Address('Polska', 'Warszawa', '00-001', 'ul. Testowa', 150),
    );

    let transit = new Transit(TransitStatus.DRAFT, Tariff.ofTime(date), uuid());
    const transitDriver = driver ?? (await this.createTestDriver());

    transit = await this.transitRepository.save(transit);

    await this.transitDetailsFacade.transitRequested(
      date,
      transit.getRequestUUID(),
      fromAddress,
      toAddress,
      Distance.ZERO,
      client ?? (await this.createTestClient()),
      CarClass.REGULAR,
      new Money(price),
      transit.getTariff(),
    );
    await this.transitDetailsFacade.transitAccepted(
      transit.getRequestUUID(),
      transitDriver.getId(),
      date,
    );
    await this.transitDetailsFacade.transitStarted(
      transit.getRequestUUID(),
      transit.getId(),
      date,
    );
    await this.transitDetailsFacade.transitCompleted(
      transit.getRequestUUID(),
      date,
      new Money(price),
      new Money(0),
    );
    // transit.completeTransitAt(Distance.ZERO);

    return transit;
  }

  public async aRequestedAndCompletedTransit(
    price: number,
    publishedAt: Date,
    completedAt: Date,
    client: Client,
    driver: Driver,
    from: Address,
    to: Address,
    carClass: CarClass = CarClass.REGULAR,
  ) {
    await this.createActiveCarCategory(carClass);

    from = await this.addressRepository.save(from);
    to = await this.addressRepository.save(to);

    jest.spyOn(Clock, 'currentDate').mockReturnValue(publishedAt);
    jest.spyOn(Date, 'now').mockReturnValue(publishedAt.getTime());

    const transitView = await this.rideService.createTransit(
      client.getId(),
      from,
      to,
      carClass,
    );
    await this.rideService.publishTransit(transitView.getRequestUUID());
    await this.rideService.findDriversForTransit(transitView.getRequestUUID());
    await this.rideService.acceptTransit(
      driver.getId(),
      transitView.getRequestUUID(),
    );
    await this.rideService.startTransit(
      driver.getId(),
      transitView.getRequestUUID(),
    );

    jest.spyOn(Clock, 'currentDate').mockReturnValue(completedAt);
    jest.spyOn(Date, 'now').mockReturnValue(completedAt.getTime());

    await this.rideService.completeTransit(
      driver.getId(),
      transitView.getRequestUUID(),
      to,
    );

    jest.clearAllMocks();

    return this.rideService.loadTransit(transitView.getRequestUUID());
  }

  public async createTransitDTO(
    from: AddressDTO,
    to: AddressDTO,
    client?: Client,
    carClass?: CarClass,
  ): Promise<TransitDTO> {
    const transitClient = client ?? (await this.createTestClient());
    const transitDto = TransitDTO.createEmpty();

    transitDto.setClientDTO(new ClientDTO(transitClient));
    transitDto.setFrom(from);
    transitDto.setTo(to);
    transitDto.setCarClass(carClass ?? CarClass.VAN);

    return transitDto;
  }

  public async driverHasFee(
    driver: Driver,
    feeType: FeeType,
    amount: number,
    min: number,
  ) {
    let driverFee = await this.driverFeeRepository.findByDriverId(
      driver.getId(),
    );

    if (!driverFee) {
      driverFee = new DriverFee(feeType, driver, amount, min);
    }

    await this.driverFeeRepository.save(driverFee);

    return driverFee;
  }

  public createTestClient(type?: Type) {
    const client = new Client(type ?? Type.NORMAL);

    client.setClientType(ClientType.INDIVIDUAL);
    client.setName('Tester');
    client.setLastName('Tester');
    client.setDefaultPaymentType(PaymentType.POST_PAID);

    return this.clientRepository.save(client);
  }

  public async createActiveCarCategory(carClass: CarClass) {
    const randomNumberFrom1to5 = Math.floor(Math.random() * 5) + 1;

    const carTypeObj = new CarType(
      carClass,
      'description',
      randomNumberFrom1to5,
    );
    const carTypeDTO = new CarTypeDTO(carTypeObj);

    const carType = await this.carTypeService.create(carTypeDTO);

    for (let i = 1; i < carType.getMinNoOfCarsToActivateClass() + 1; i += 1) {
      await this.carTypeService.registerCar(carType.getCarClass());
    }

    await this.carTypeService.activate(carType.getId());

    return carType;
  }

  public async createClaim(
    client: Client,
    transit: Transit | TransitDTO,
    reason?: string,
  ) {
    const claimDto = this.createClaimDTO(
      'description',
      reason ?? 'reason',
      client.getId(),
      transit.getId(),
    );

    claimDto.setDraft(false);

    const claim = await this.claimService.create(claimDto);

    return claim;
  }

  public createClaimDTO(
    desc: string,
    reason: string,
    clientId: string,
    transitId: string,
  ) {
    const claimDTO = new ClaimDTO();

    claimDTO.setClientId(clientId);
    claimDTO.setTransitId(transitId);
    claimDTO.setIncidentDescription(desc);
    claimDTO.setReason(reason);

    return claimDTO;
  }

  public async createClientWithClaims(type: Type, claimsAmount: number) {
    const client = await this.createTestClient(type);

    await this.clientHasDoneClaims(client, claimsAmount);

    return client;
  }

  public async clientHasDoneClaims(client: Client, claimsAmount: number) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of Array(claimsAmount)) {
      const driver = await this.createTestDriver();

      const transit = await this.createTransitDetails(
        driver,
        20,
        new Date(),
        client,
        new Address('Polska', 'Warszawa', '00-001', 'ul. Testowa', 1),
        new Address('Polska', 'Warszawa', '00-001', 'ul. Testowa', 150),
      );

      await this.createAndResolveClaim(client, transit);
    }
  }

  public async clientHasDoneTransits(client: Client, transitsAmount: number) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of Array(transitsAmount)) {
      const driver = await this.createTestDriver();

      await this.createCompletedTransitAt(10, new Date(), client, driver);
    }
  }

  public async createAndResolveClaim(client: Client, transit: Transit) {
    let claim = await this.createClaim(client, transit);
    claim = await this.claimService.tryToResolveAutomatically(claim.getId());
    return claim;
  }

  public async createAwardsAccount(client: Client) {
    await this.awardsService.registerToProgram(client.getId());
  }

  public async createActiveAwardsAccount(client: Client) {
    await this.createAwardsAccount(client);
    await this.awardsService.activateAccount(client.getId());
  }

  public async driverHasAttribute(
    driver: Driver,
    attributeName: DriverAttributeName,
    value: string,
  ) {
    await this.driverAttributeRepository.save(
      new DriverAttribute(driver, attributeName, value),
    );
  }

  private async stubTransitPrice(price: Money) {
    const fakeTariff = Tariff.create(0, 'fake', price);

    jest.spyOn(Tariffs.prototype, 'choose').mockReturnValue(fakeTariff);
  }
}
