import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Money } from '../money/money';
import { DriverFeeRepository } from '../repository/driver-fee.repository';
import { TransitRepository } from '../repository/transit.repository';

@Injectable()
export class DriverFeeService {
  constructor(
    @InjectRepository(DriverFeeRepository)
    private driverFeeRepository: DriverFeeRepository,
    @InjectRepository(TransitRepository)
    private transitRepository: TransitRepository,
  ) {}

  public async calculateDriverFee(transitId: string): Promise<Money> {
    const transit = await this.transitRepository.findOne(transitId);

    if (!transit) {
      throw new NotFoundException('transit does not exist, id = ' + transitId);
    }

    if (transit.getDriversFee().toInt() != null) {
      return transit.getDriversFee();
    }

    const transitPrice = transit.getPrice() ?? new Money(0);
    const driver = transit.getDriver();

    if (!driver) {
      throw new NotFoundException(
        'driver not exist for transit = ' + transitId,
      );
    }

    const driverFee = await this.driverFeeRepository.findByDriver(driver);

    if (!driverFee) {
      throw new NotFoundException(
        'driver Fees not defined for driver, driver id = ' + driver.getId(),
      );
    }

    return driverFee.calculateDriverFee(transitPrice);
  }
}
