import { EntityRepository, Repository } from 'typeorm';

import { RequestForTransit } from './request-for-transit.entity';

@EntityRepository(RequestForTransit)
export class RequestForTransitRepository extends Repository<RequestForTransit> {
  public async findByRequestUUID(requestUUID: string) {
    return this.findOne({
      where: {
        requestUUID,
      },
    });
  }
}
