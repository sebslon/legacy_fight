import { EntityRepository, Repository } from 'typeorm';

import { Client } from '../entity/client.entity';
import { AwardsAccount } from '../miles/awards-account.entity';

@EntityRepository(AwardsAccount)
export class AwardsAccountRepository extends Repository<AwardsAccount> {
  public async findByClientId(clientId: string | undefined) {
    return this.findOne({ where: { clientId } });
  }

  public async findByClientIdOrThrow(clientId: string) {
    const account = await this.findByClientId(clientId);

    if (!account) {
      throw new Error(`Account does not exists, id = ${clientId}`);
    }

    return account;
  }

  public async findAllMilesByClient(client: Client) {
    const account = await this.findByClientIdOrThrow(client.getId());

    return account.getMiles();
  }
}
