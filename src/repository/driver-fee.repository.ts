import { EntityRepository, Repository } from 'typeorm';

import { DriverFee } from '../entity/driver-fee.entity';

@EntityRepository(DriverFee)
export class DriverFeeRepository extends Repository<DriverFee> {
  public async findByDriverId(driverId: string) {
    return this.createQueryBuilder()
      .where('"driverId" = :id', { id: driverId })
      .getOne();
  }
}
