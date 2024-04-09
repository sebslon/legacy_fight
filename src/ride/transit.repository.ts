import { EntityRepository, Repository } from 'typeorm';

import { TransitStatus, Transit } from './transit.entity';

@EntityRepository(Transit)
export class TransitRepository extends Repository<Transit> {
  public async findAllByStatus(status: TransitStatus): Promise<Transit[]> {
    return await this.find({
      where: {
        status,
      },
    });
  }

  public async findByClientId(clientId: string): Promise<Transit[]> {
    return this.query(
      `
      SELECT * FROM transit t
      JOIN transit_details td ON t."requestUUID" = td."requestUUID"
      WHERE td."clientId" = $1
    `,
      [clientId],
    );
  }

  public async findByTransitRequestUUID(
    transitRequestUUID: string,
  ): Promise<Transit | undefined> {
    return this.findOne({
      where: {
        requestUUID: transitRequestUUID,
      },
    });
  }
}
