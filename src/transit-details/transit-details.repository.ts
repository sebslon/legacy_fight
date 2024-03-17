import { Between, EntityRepository, Repository } from 'typeorm';

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
          id: clientId,
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
        dateTime: Between(from.getTime(), to.getTime()),
      },
    });
  }
}
