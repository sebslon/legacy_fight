import { EntityRepository, Repository } from 'typeorm';

import { TimeSlot } from './time-slot';
import { TravelledDistance } from './travelled-distance.entity';

@EntityRepository(TravelledDistance)
export class TravelledDistanceRepository extends Repository<TravelledDistance> {
  public async findTravelledDistanceTimeSlotByTime(
    when: Date,
    driverId: string,
  ) {
    return this.createQueryBuilder('td')
      .where(
        `timeslot->>'beginning' <= :when AND timeslot->>'end' > :when AND "driverId" = :driverId`,
        {
          when: when.toISOString(),
          driverId,
        },
      )
      .getOne();
  }

  public async findTravelledDistanceByTimeSlotAndDriverId(
    timeSlot: TimeSlot,
    driverId: string,
  ) {
    return this.createQueryBuilder('td')
      .where('"driverId" = :driverId', { driverId })
      .andWhere(`timeslot->>'beginning' = :beginning`, {
        beginning: timeSlot.getBeginning(),
      })
      .andWhere(`timeslot->>'end' = :end`, { end: timeSlot.getEnd() })
      .getOne();
  }

  public async calculateDistance(beginning: Date, to: Date, driverId: string) {
    const result = await this.query(
      `
      SELECT COALESCE(SUM(distance), 0) as sum
      FROM (
        SELECT distance FROM travelled_distance td
        WHERE timeslot->>'beginning' >= $1 AND timeslot->>'end' <= $2 AND td."driverId" = $3
      ) as distance
    `,
      [beginning.toISOString(), to.toISOString(), driverId],
    );
    return result[0].sum as number;
  }
}
