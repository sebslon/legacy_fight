import { EntityRepository, Repository } from 'typeorm';

import { Client } from '../entity/client.entity';
import { AwardedMiles } from '../miles/awarded-miles.entity';

@EntityRepository(AwardedMiles)
export class AwardedMilesRepository extends Repository<AwardedMiles> {
  public async findAllByClient(client: Client) {
    return this.find({ where: { client } });
  }
}
