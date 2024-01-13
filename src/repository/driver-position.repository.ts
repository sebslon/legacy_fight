import { Between, EntityRepository, Repository } from 'typeorm';

import { DriverPositionV2Dto } from '../dto/driver-position-v2.dto';
import { DriverPosition } from '../entity/driver-position.entity';
import { Driver } from '../entity/driver.entity';

@EntityRepository(DriverPosition)
export class DriverPositionRepository extends Repository<DriverPosition> {
  public async findAverageDriverPositionSince(
    latitudeMin: number,
    latitudeMax: number,
    longitudeMin: number,
    longitudeMax: number,
    date: number,
  ): Promise<DriverPositionV2Dto[]> {
    const driverPositions = await this.createQueryBuilder('dp')
      .leftJoinAndSelect('dp.driver', 'd')
      .addSelect('AVG(dp.latitude)', 'latitude')
      .addSelect('AVG(dp.longitude)', 'longitude')
      .addSelect('MAX(dp.seenAt)', 'seenAt')
      .where('dp.longitude between :longitudeMin and :longitudeMax')
      .andWhere('dp.latitude between :latitudeMin and :latitudeMax')
      .andWhere('dp.seenAt >= :seenAt')
      .groupBy('dp.id, d.id')
      .setParameters({
        longitudeMin,
        longitudeMax,
        latitudeMin,
        latitudeMax,
        seenAt: date,
      })
      .getMany();

    return driverPositions.map(
      (dp) =>
        new DriverPositionV2Dto(
          dp.driver,
          dp.latitude,
          dp.longitude,
          dp.seenAt,
        ),
    );
  }

  public async findByDriverAndSeenAtBetweenOrderBySeenAtAsc(
    driver: Driver,
    from: number,
    to: number,
  ): Promise<DriverPosition[]> {
    return this.find({
      where: {
        driver,
        seenAt: Between(from, to),
      },
      order: {
        seenAt: 'ASC',
      },
    });
  }
}
