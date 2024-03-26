import { Between, EntityRepository, Repository } from 'typeorm';

import { Driver } from '../driver-fleet/driver.entity';

import { DriverPositionV2DTO } from './driver-position-v2.dto';
import { DriverPosition } from './driver-position.entity';

@EntityRepository(DriverPosition)
export class DriverPositionRepository extends Repository<DriverPosition> {
  public async findAverageDriverPositionSince(
    latitudeMin: number,
    latitudeMax: number,
    longitudeMin: number,
    longitudeMax: number,
    date: number,
  ): Promise<DriverPositionV2DTO[]> {
    const driverPositions = await this.createQueryBuilder('dp')
      .addSelect('AVG(dp.latitude)', 'latitude')
      .addSelect('AVG(dp.longitude)', 'longitude')
      .addSelect('MAX(dp.seenAt)', 'seenAt')
      .where('dp.longitude between :longitudeMin and :longitudeMax')
      .andWhere('dp.latitude between :latitudeMin and :latitudeMax')
      .andWhere('dp.seenAt >= :seenAt')
      .groupBy('dp.id, dp.driverId')
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
        new DriverPositionV2DTO(
          dp.driverId,
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
        driverId: driver,
        seenAt: Between(from, to),
      },
      order: {
        seenAt: 'ASC',
      },
    });
  }
}
