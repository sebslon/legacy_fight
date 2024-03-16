import { TransitDetails } from 'src/transit-details/transit-details.entity';
import { Between, EntityRepository, MoreThan, Repository } from 'typeorm';

import { Address } from '../entity/address.entity';
import { Client } from '../entity/client.entity';
import { Driver } from '../entity/driver.entity';
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

  public async findByClient(client: Client): Promise<Transit[]> {
    return this.find({
      where: {
        transitDetails: {
          client,
        },
      },
      relations: ['transitDetails'],
    });
  }
}
