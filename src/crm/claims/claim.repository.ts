import { EntityRepository, Repository } from 'typeorm';

import { Claim } from './claim.entity';

@EntityRepository(Claim)
export class ClaimRepository extends Repository<Claim> {
  public async findAllByOwnerId(ownerId: string): Promise<Claim[]> {
    return this.find({
      where: {
        ownerId,
      },
    });
  }
}
