import { Injectable, NotFoundException } from '@nestjs/common';

import { AppProperties } from '../config/app-properties.config';
import { CarTypeDto } from '../dto/car-type.dto';
import { CarClass, CarStatus, CarType } from '../entity/car-type.entity';
import { CarTypeRepository } from '../repository/car-type.repository';

@Injectable()
export class CarTypeService {
  constructor(
    private readonly carTypeRepository: CarTypeRepository,
    private readonly appProperties: AppProperties,
  ) {}

  public async load(id: string) {
    const carType = await this.carTypeRepository.findOne(id);
    if (!carType) {
      throw new NotFoundException('Cannot find car type');
    }
    return carType;
  }

  public async loadDto(id: string): Promise<CarTypeDto> {
    const carType = await this.load(id);
    const activeCarsCounter = await this.carTypeRepository.findActiveCounter(
      carType.getCarClass(),
    );

    return new CarTypeDto(carType, activeCarsCounter.getActiveCarsCounter());
  }

  public async create(carTypeDTO: CarTypeDto): Promise<CarType> {
    const byCarClass = await this.carTypeRepository.findByCarClass(
      carTypeDTO.getCarClass(),
    );

    if (byCarClass) {
      byCarClass.setDescription(carTypeDTO.getDescription());
      return this.carTypeRepository.save(byCarClass);
    } else {
      const carType = new CarType(
        carTypeDTO.getCarClass(),
        carTypeDTO.getDescription(),
        this.getMinNumberOfCars(carTypeDTO.getCarClass()),
      );

      return this.carTypeRepository.save(carType);
    }
  }

  public async activate(id: string) {
    const carType = await this.load(id);

    carType.activate();

    await this.carTypeRepository.save(carType);
  }

  public async deactivate(id: string) {
    const carType = await this.load(id);

    carType.deactivate();

    await this.carTypeRepository.save(carType);
  }

  public async registerCar(carClass: CarClass) {
    const carType = await this.findByCarClass(carClass);

    carType.registerCar();

    await this.carTypeRepository.save(carType);
  }

  public async unregisterCar(carClass: CarClass) {
    const carType = await this.findByCarClass(carClass);

    carType.unregisterCar();

    await this.carTypeRepository.save(carType);
  }

  public async registerActiveCar(carClass: CarClass) {
    await this.carTypeRepository.incrementCounter(carClass);
  }

  public async unregisterActiveCar(carClass: CarClass) {
    await this.carTypeRepository.decrementCounter(carClass);
  }

  public async findActiveCarClasses() {
    const cars = await this.carTypeRepository.findByStatus(CarStatus.ACTIVE);
    return cars.map((car) => car.getCarClass());
  }

  public async removeCarType(carClass: CarClass) {
    const carType = await this.carTypeRepository.findByCarClass(carClass);

    if (carType) {
      await this.carTypeRepository.delete(carType);
    }
  }

  private async findByCarClass(carClass: CarClass) {
    const byCarClass = await this.carTypeRepository.findByCarClass(carClass);

    if (!byCarClass) {
      throw new NotFoundException(`Car class does not exist: ${carClass}`);
    }

    return byCarClass;
  }

  private getMinNumberOfCars(carClass: CarClass) {
    if (carClass === CarClass.ECO) {
      return this.appProperties.getMinNoOfCarsForEcoClass();
    } else {
      return 10;
    }
  }
}
