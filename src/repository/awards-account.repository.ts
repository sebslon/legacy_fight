import { EntityRepository, Repository } from 'typeorm';

import { Client } from '../entity/client.entity';
import { AwardsAccount } from '../miles/awards-account.entity';

@EntityRepository(AwardsAccount)
export class AwardsAccountRepository extends Repository<AwardsAccount> {
  public async findByClient(client: Client | undefined) {
    return this.findOne({ where: { client } });
  }

  public async findByClientOrThrow(client: Client) {
    const account = await this.findByClient(client);

    if (!account) {
      throw new Error(`Account does not exists, id = ${client.getId()}`);
    }

    return account;
  }

  public async findAllMilesByClient(client: Client) {
    const account = await this.findByClientOrThrow(client);

    return account.getMiles();
  }
}
