import { CarClass } from '../../../src/car-fleet/car-class.enum';
import { Clock } from '../../../src/common/clock';
import {
  DriverAttribute,
  DriverAttributeName,
} from '../../../src/entity/driver-attribute.entity';
import { DriverFee, FeeType } from '../../../src/entity/driver-fee.entity';
import {
  Driver,
  DriverStatus,
  DriverType,
} from '../../../src/entity/driver.entity';
import { DriverAttributeRepository } from '../../../src/repository/driver-attribute.repository';
import { DriverFeeRepository } from '../../../src/repository/driver-fee.repository';
import { DriverSessionService } from '../../../src/service/driver-session.service';
import { DriverTrackingService } from '../../../src/service/driver-tracking.service';
import { DriverService } from '../../../src/service/driver.service';

export class DriverFixture {
  constructor(
    private readonly driverFeeRepository: DriverFeeRepository,
    private readonly driverService: DriverService,
    private readonly driverAttributeRepository: DriverAttributeRepository,
    private readonly driverSessionService: DriverSessionService,
    private readonly driverTrackingService: DriverTrackingService,
  ) {}

  public async driverHasFee(
    driver: Driver,
    feeType: FeeType,
    amount: number,
    min = 0,
  ) {
    const driverFee = new DriverFee(feeType, driver, amount, min);

    await this.driverFeeRepository.save(driverFee);

    return driverFee;
  }

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

  public async createNearbyDriver(plateNumber: string) {
    const driver = await this.createTestDriver();

    await this.driverHasFee(driver, FeeType.FLAT, 10, 0);

    await this.driverSessionService.logIn(
      driver.getId(),
      plateNumber,
      CarClass.VAN,
      'BRAND',
    );
    await this.driverTrackingService.registerPosition(
      driver.getId(),
      1,
      1,
      Clock.currentDate(),
    );

    return driver;
  }

  public async driverIsAtGeoLocalization(
    plateNumber: string,
    latitude: number,
    longitude: number,
    carClass: CarClass,
    driver: Driver,
    when: Date,
  ) {
    await this.driverTrackingService.registerPosition(
      driver.getId(),
      latitude,
      longitude,
      when,
    );
    return driver;
  }

  public driverLogsIn(
    plateNumber: string,
    carClass: CarClass,
    driver: Driver,
    carBrand: string,
  ) {
    return this.driverSessionService.logIn(
      driver.getId(),
      plateNumber,
      carClass,
      carBrand,
    );
  }

  public driverLogsOut(driver: Driver) {
    return this.driverSessionService.logOutCurrentSession(driver.getId());
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
