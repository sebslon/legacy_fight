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
