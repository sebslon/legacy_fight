import { EntityRepository, Repository } from 'typeorm';

import { ClaimsResolver } from './claims-resolver.entity';

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
