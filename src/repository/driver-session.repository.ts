import { NotFoundException } from '@nestjs/common';
import { EntityRepository, MoreThan, Repository, IsNull, In } from 'typeorm';

import { CarClass } from '../car-fleet/car-class.enum';
import { DriverSession } from '../entity/driver-session.entity';
import { Driver } from '../entity/driver.entity';

@EntityRepository(DriverSession)
export class DriverSessionRepository extends Repository<DriverSession> {
  public async findAllByLoggedOutAtNullAndDriverInAndCarClassIn(
    drivers: Driver[],
    carClasses: CarClass[],
  ): Promise<DriverSession[]> {
    return this.find({
      where: {
        driver: {
          id: In(drivers.map((driver) => driver.getId())),
        },
        carClass: In(carClasses),
        loggedOutAt: IsNull(),
      },
      relations: ['driver'],
    });
  }

  public async findTopByDriverAndLoggedOutAtIsNullOrderByLoggedAtDesc(
    driver: Driver,
  ): Promise<DriverSession> {
    const session = await this.findOne({
      where: { driver, loggedOutAt: IsNull() },
      order: {
        loggedAt: 'DESC',
      },
    });

    if (!session) {
      throw new NotFoundException(`Session for ${driver.getId()} not exists`);
    }
    return session;
  }

  public async findAllByDriverAndLoggedAtAfter(
    driver: Driver,
    since: number,
  ): Promise<DriverSession[]> {
    return this.find({
      where: {
        driver,
        loggedAt: MoreThan(since),
      },
    });
  }

  public async findByDriver(driver: Driver): Promise<DriverSession[]> {
    return this.find({ where: { driver } });
  }
}
