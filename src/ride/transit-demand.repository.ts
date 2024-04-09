import { EntityRepository, Repository } from 'typeorm';

import { TransitDemand } from './transit-demand.entity';

@EntityRepository(TransitDemand)
export class TransitDemandRepository extends Repository<TransitDemand> {
  public async findByTransitRequestUUID(requestUUID: string) {
    return this.findOne({
      where: {
        requestUUID,
      },
    });
  }
}
