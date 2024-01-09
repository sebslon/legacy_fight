import { Address } from '../../src/entity/address.entity';
import { CarClass } from '../../src/entity/car-type.entity';
import {
  Client,
  ClientType,
  PaymentType,
  Type,
} from '../../src/entity/client.entity';
import { DriverFee, FeeType } from '../../src/entity/driver-fee.entity';
import {
  Driver,
  DriverStatus,
  DriverType,
} from '../../src/entity/driver.entity';
import { Transit, TransitStatus } from '../../src/entity/transit.entity';
import { Money } from '../../src/money/money';
import { AddressRepository } from '../../src/repository/address.repository';
import { ClientRepository } from '../../src/repository/client.repository';
import { DriverFeeRepository } from '../../src/repository/driver-fee.repository';
import { TransitRepository } from '../../src/repository/transit.repository';
import { DriverService } from '../../src/service/driver.service';

export class Fixtures {
  constructor(
    private readonly driverService: DriverService,
    private readonly driverFeeRepository: DriverFeeRepository,
    private readonly transitRepository: TransitRepository,
    private readonly addressRepository: AddressRepository,
    private readonly clientRepository: ClientRepository,
  ) {}

  public createTestDriver() {
    return this.driverService.createDriver({
      firstName: 'Test',
      lastName: 'Driver',
      driverLicense: 'FARME100165AB5EW',
      type: DriverType.REGULAR,
      status: DriverStatus.ACTIVE,
      photo: Buffer.from('test', 'utf-8').toString('base64'),
    });
  }

  public async createTestTransit(
    driver: Driver | null,
    price: number,
    date?: Date,
  ) {
    const transit = new Transit();

    transit.setPrice(new Money(price));
    transit.setDriver(driver);
    transit.setStatus(TransitStatus.COMPLETED);
    transit.setCarType(CarClass.REGULAR);
    transit.setDateTime(date?.getTime() ?? Date.now());

    await this.transitRepository.save(transit);

    return transit;
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

  public createTestClient() {
    const client = new Client();

    client.setClientType(ClientType.INDIVIDUAL);
    client.setType(Type.NORMAL);
    client.setName('Tester');
    client.setLastName('Tester');
    client.setDefaultPaymentType(PaymentType.POST_PAID);

    return this.clientRepository.save(client);
  }

  public async createCompletedTransitAt(price: number, date: Date) {
    const transit = await this.createTestTransit(null, price, date);
    const client = await this.createTestClient();

    transit.setDateTime(date.getTime());
    transit.setTo(
      await this.addressRepository.save(
        new Address('Polska', 'Warszawa', '00-001', 'ul. Testowa', 1),
      ),
    );
    transit.setFrom(
      await this.addressRepository.save(
        new Address('Polska', 'Warszawa', '00-001', 'ul. Testowa', 150),
      ),
    );
    transit.setClient(client);

    return this.transitRepository.save(transit);
  }
}
