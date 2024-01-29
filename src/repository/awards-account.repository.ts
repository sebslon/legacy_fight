import { EntityRepository, Repository } from 'typeorm';

import { Client } from '../entity/client.entity';
import { AwardsAccount } from '../miles/awards-account.entity';

@EntityRepository(AwardsAccount)
export class AwardsAccountRepository extends Repository<AwardsAccount> {
  public async findByClient(client: Client | undefined) {
    return this.findOne({ where: { client } });
  }
}
