import { Between, EntityRepository, Repository } from 'typeorm';

import { Driver } from '../driver-fleet/driver.entity';
import { TransitStatus, Transit } from '../entity/transit/transit.entity';

@EntityRepository(Transit)
export class TransitRepository extends Repository<Transit> {
  public async findAllByDriverAndDateTimeBetween(
    driver: Driver,
    from: number,
    to: number,
  ): Promise<Transit[]> {
    return await this.find({
      where: {
        driver,
        transitDetails: {
          dateTime: Between(from, to),
        },
      },
      relations: ['transitDetails'],
    });
  }

  public async findAllByStatus(status: TransitStatus): Promise<Transit[]> {
    return await this.find({
      where: {
        status,
      },
    });
  }

  public async findByClientId(clientId: string): Promise<Transit[]> {
    return this.find({
      where: {
        transitDetails: {
          client: {
            id: clientId,
          },
        },
      },
      relations: ['transitDetails'],
    });
  }
}
