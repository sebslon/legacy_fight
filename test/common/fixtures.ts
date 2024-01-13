import { AddressDto } from '../../src/dto/address.dto';
import { CarTypeDto } from '../../src/dto/car-type.dto';
import { ClientDto } from '../../src/dto/client.dto';
import { TransitDto } from '../../src/dto/transit.dto';
import { Address } from '../../src/entity/address.entity';
import { CarClass, CarType } from '../../src/entity/car-type.entity';
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
import { CarTypeService } from '../../src/service/car-type.service';
import { DriverService } from '../../src/service/driver.service';

export class Fixtures {
  constructor(
    private readonly driverService: DriverService,
    private readonly driverFeeRepository: DriverFeeRepository,
    private readonly transitRepository: TransitRepository,
    private readonly addressRepository: AddressRepository,
    private readonly clientRepository: ClientRepository,
    private readonly carTypeService: CarTypeService,
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

  public async createTransitDTO(
    from: AddressDto,
    to: AddressDto,
    client?: Client,
    carClass?: CarClass,
  ): Promise<TransitDto> {
    const transitClient = client ?? (await this.createTestClient());
    const transitDto = new TransitDto();

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

  public async createActiveCarCategory(carClass: CarClass) {
    const randomNumberFrom1to5 = Math.floor(Math.random() * 5) + 1;

    const carTypeObj = new CarType(
      carClass,
      'description',
      randomNumberFrom1to5,
    );
    const carTypeDTO = new CarTypeDto(carTypeObj);

    const carType = await this.carTypeService.create(carTypeDTO);

    for (let i = 1; i < carType.getMinNoOfCarsToActivateClass() + 1; i += 1) {
      await this.carTypeService.registerCar(carType.getCarClass());
    }

    await this.carTypeService.activate(carType.getId());

    return carType;
  }
}
