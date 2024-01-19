import { EntityRepository, Repository } from 'typeorm';

import { ClaimsResolver } from '../entity/claims-resolver.entity';

@EntityRepository(ClaimsResolver)
export class ClaimsResolverRepository extends Repository<ClaimsResolver> {
  public findByClientId(clientId: string): Promise<ClaimsResolver | undefined> {
    return this.findOne({
      where: {
        clientId,
      },
    });
  }
}
