import { Money } from '../../src/money/money';
import { Transit, TransitStatus } from '../../src/entity/transit.entity';
import { TransitRepository } from '../../src/repository/transit.repository';
import {
  Driver,
  DriverStatus,
  DriverType,
} from '../../src/entity/driver.entity';
import { CarClass } from '../../src/entity/car-type.entity';
import { DriverFee, FeeType } from '../../src/entity/driver-fee.entity';
import { DriverFeeRepository } from '../../src/repository/driver-fee.repository';
import { DriverService } from '../../src/service/driver.service';

export class Fixtures {
  constructor(
    private readonly driverService: DriverService,
    private readonly driverFeeRepository: DriverFeeRepository,
    private readonly transitRepository: TransitRepository,
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

  public async createTestTransit(driver: Driver, price: number, date?: Date) {
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
}
