import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';

import { doInTransaction } from '../common/do-in-transaction';
import { CarTypeActiveCounter } from '../entity/car-type-active-counter.entity';
import { CarClass, CarStatus, CarType } from '../entity/car-type.entity';

@EntityRepository(CarType)
export class CarTypeEntityRepository extends Repository<CarType> {
  public async findByCarClass(carClass: CarClass) {
    return this.findOne({ where: { carClass } });
  }

  public async findByStatus(status: CarStatus): Promise<CarType[]> {
    return this.find({ where: { status } });
  }
}

@EntityRepository(CarTypeActiveCounter)
export class CarTypeActiveCounterRepository extends Repository<CarTypeActiveCounter> {
  public async findByCarClass(
    carClass: CarClass,
  ): Promise<CarTypeActiveCounter> {
    const counter = await this.findOne({ where: { carClass } });

    if (!counter) {
      throw new NotFoundException(
        'Cannot find car type active counter for ' + carClass,
      );
    }

    return counter;
  }

  public async incrementCounter(carClass: CarClass): Promise<void> {
    await this.query(
      `
      UPDATE car_type_active_counter
      SET "activeCarsCounter" = "activeCarsCounter" + 1
      WHERE "carClass" = $1
    `,
      [carClass],
    );
  }

  public async decrementCounter(carClass: CarClass): Promise<void> {
    await this.query(
      `
      UPDATE car_type_active_counter
      SET "activeCarsCounter" = "activeCarsCounter" - 1
      WHERE "carClass" = $1
    `,
      [carClass],
    );
  }
}

@Injectable()
export class CarTypeRepository {
  constructor(
    private readonly carTypeEntityRepository: CarTypeEntityRepository,
    private readonly carTypeActiveCounterRepository: CarTypeActiveCounterRepository,
  ) {}

  public async findByCarClass(
    carClass: CarClass,
  ): Promise<CarType | undefined> {
    return this.carTypeEntityRepository.findByCarClass(carClass);
  }

  public async findActiveCounter(
    carClass: CarClass,
  ): Promise<CarTypeActiveCounter> {
    return this.carTypeActiveCounterRepository.findByCarClass(carClass);
  }

  public async findByStatus(status: CarStatus): Promise<CarType[]> {
    return this.carTypeEntityRepository.findByStatus(status);
  }

  public async incrementCounter(carClass: CarClass): Promise<void> {
    return this.carTypeActiveCounterRepository.incrementCounter(carClass);
  }

  public async decrementCounter(carClass: CarClass): Promise<void> {
    return this.carTypeActiveCounterRepository.decrementCounter(carClass);
  }

  public async create(carType: CarType): Promise<CarType> {
    return await doInTransaction<CarType>(async () => {
      await this.carTypeActiveCounterRepository.save(
        new CarTypeActiveCounter(carType.getCarClass()),
      );

      return this.carTypeEntityRepository.save(carType);
    });
  }

  public async updateCarType(carType: CarType): Promise<CarType> {
    return this.carTypeEntityRepository.save(carType);
  }

  public async findOne(id: string) {
    return this.carTypeEntityRepository.findOne(id);
  }

  public async delete(carType: CarType) {
    await this.carTypeEntityRepository.delete(carType.getId());
    await this.carTypeActiveCounterRepository.delete(
      await this.carTypeActiveCounterRepository.findByCarClass(
        carType.getCarClass(),
      ),
    );
  }
}
