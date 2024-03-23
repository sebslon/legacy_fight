import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Money } from '../money/money';

import { DriverFeeRepository } from './driver-fee.repository';

@Injectable()
export class DriverFeeService {
  constructor(
    @InjectRepository(DriverFeeRepository)
    private driverFeeRepository: DriverFeeRepository,
  ) {}

  public async calculateDriverFee(
    transitPrice: Money,
    driverId: string,
  ): Promise<Money> {
    const driverFee = await this.driverFeeRepository.findByDriverId(driverId);

    if (!driverFee) {
      throw new NotFoundException(
        'driver Fees not defined for driver, driver id = ' + driverId,
      );
    }

    return driverFee.calculateDriverFee(transitPrice);
  }
}
