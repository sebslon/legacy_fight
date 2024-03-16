import { EntityRepository, Repository } from 'typeorm';

import { TransitDetails } from './transit-details.entity';

@EntityRepository(TransitDetails)
export class TransitDetailsRepository extends Repository<TransitDetails> {
  public async findByTransitId(transitId: string) {
    return this.findOne({
      where: {
        transitId,
      },
    });
  }

  public async findManyByClientId(clientId: string) {
    return this.find({
      where: {
        client: {
          clientId,
        },
      },
    });
  }

  public async findAllByDriverAndDateTimeBetween(
    driverId: string,
    from: Date,
    to: Date,
  ) {
    return this.find({
      where: {
        driverId,
        dateTime: {
          $gte: from,
          $lte: to,
        },
      },
    });
  }
}
