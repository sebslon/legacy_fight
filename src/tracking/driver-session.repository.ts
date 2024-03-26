import { NotFoundException } from '@nestjs/common';
import { EntityRepository, MoreThan, Repository, IsNull, In } from 'typeorm';

import { CarClass } from '../car-fleet/car-class.enum';

import { DriverSession } from './driver-session.entity';

@EntityRepository(DriverSession)
export class DriverSessionRepository extends Repository<DriverSession> {
  public async findAllByLoggedOutAtNullAndDriverIdInAndCarClassIn(
    driverIds: string[],
    carClasses: CarClass[],
  ): Promise<DriverSession[]> {
    return this.find({
      where: {
        driverId: In(driverIds),
        carClass: In(carClasses),
        loggedOutAt: IsNull(),
      },
    });
  }

  public async findTopByDriverIdAndLoggedOutAtIsNullOrderByLoggedAtDesc(
    driverId: string,
  ): Promise<DriverSession> {
    const session = await this.findOne({
      where: { driverId, loggedOutAt: IsNull() },
      order: {
        loggedAt: 'DESC',
      },
    });

    if (!session) {
      throw new NotFoundException(`Session for ${driverId} not exists`);
    }
    return session;
  }

  public async findAllByDriverIdAndLoggedAtAfter(
    driverId: string,
    since: number,
  ): Promise<DriverSession[]> {
    return this.find({
      where: {
        driverId,
        loggedAt: MoreThan(since),
      },
    });
  }

  public async findByDriverId(driverId: string): Promise<DriverSession[]> {
    return this.find({ where: { driverId } });
  }
}
