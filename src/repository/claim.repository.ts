import { EntityRepository, Repository } from 'typeorm';

import { Claim } from '../entity/claim.entity';

@EntityRepository(Claim)
export class ClaimRepository extends Repository<Claim> {}
