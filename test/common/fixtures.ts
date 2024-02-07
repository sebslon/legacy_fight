import { Distance } from '../../src/distance/distance';
import { AddressDTO } from '../../src/dto/address.dto';
import { CarTypeDTO } from '../../src/dto/car-type.dto';
import { ClaimDTO } from '../../src/dto/claim.dto';
import { ClientDto } from '../../src/dto/client.dto';
import { TransitDTO } from '../../src/dto/transit.dto';
import { Address } from '../../src/entity/address.entity';
import { CarClass, CarType } from '../../src/entity/car-type.entity';
import {
  Client,
  ClientType,
  PaymentType,
  Type,
} from '../../src/entity/client.entity';
import {
  DriverAttribute,
  DriverAttributeName,
} from '../../src/entity/driver-attribute.entity';
import { DriverFee, FeeType } from '../../src/entity/driver-fee.entity';
import {
  Driver,
  DriverStatus,
  DriverType,
} from '../../src/entity/driver.entity';
import { Transit } from '../../src/entity/transit.entity';
import { Money } from '../../src/money/money';
import { AddressRepository } from '../../src/repository/address.repository';
import { ClientRepository } from '../../src/repository/client.repository';
import { DriverAttributeRepository } from '../../src/repository/driver-attribute.repository';
import { DriverFeeRepository } from '../../src/repository/driver-fee.repository';
import { TransitRepository } from '../../src/repository/transit.repository';
import { AwardsService } from '../../src/service/awards.service';
import { CarTypeService } from '../../src/service/car-type.service';
import { ClaimService } from '../../src/service/claim.service';
import { DriverService } from '../../src/service/driver.service';

export class Fixtures {
  constructor(
    private readonly driverService: DriverService,
    private readonly driverFeeRepository: DriverFeeRepository,
    private readonly transitRepository: TransitRepository,
    private readonly addressRepository: AddressRepository,
    private readonly clientRepository: ClientRepository,
    private readonly carTypeService: CarTypeService,
    private readonly claimService: ClaimService,
    private readonly awardsService: AwardsService,
    private readonly driverAttributeRepository: DriverAttributeRepository,
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

  public async createTestTransit(
    driver: Driver,
    price: number,
    date?: Date,
    from?: Address,
    to?: Address,
    client?: Client | null,
  ) {
    const fromAddress = await this.createOrGetAddress(from);
    const toAddress = await this.createOrGetAddress(to);

    const transit = Transit.create(
      fromAddress,
      toAddress,
      client ?? (await this.createTestClient()),
      CarClass.REGULAR,
      date?.getTime() ?? Date.now(),
      Distance.ZERO,
    );

    transit.setPrice(new Money(price));

    transit.proposeTo(driver);
    transit.acceptBy(driver, new Date());

    return await this.transitRepository.save(transit);
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

    const transit = Transit.create(
      fromAddress,
      toAddress,
      client ?? (await this.createTestClient()),
      CarClass.REGULAR,
      date.getTime(),
      Distance.ZERO,
    );

    const transitDriver = driver ?? (await this.createTestDriver());

    transit.publishAt(date);
    transit.proposeTo(transitDriver);
    transit.acceptBy(transitDriver, date);
    transit.start(date);
    transit.completeTransitAt(date, toAddress, Distance.ZERO);
    transit.setPrice(new Money(price));

    return this.transitRepository.save(transit);
  }

  public async createTransitDTO(
    from: AddressDTO,
    to: AddressDTO,
    client?: Client,
    carClass?: CarClass,
  ): Promise<TransitDTO> {
    const transitClient = client ?? (await this.createTestClient());
    const transitDto = new TransitDTO();

    transitDto.setClientDTO(new ClientDto(transitClient));
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
    const driverFee = new DriverFee(feeType, driver, amount, min);

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

  public async createClaim(client: Client, transit: Transit, reason?: string) {
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

      const transit = await this.createTestTransit(
        driver,
        20,
        new Date(),
        undefined,
        undefined,
        client,
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
}
