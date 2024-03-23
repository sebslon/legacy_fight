import { Injectable, NotFoundException } from '@nestjs/common';

import { AppProperties } from '../config/app-properties.config';

import { CarClass } from './car-class.enum';
import { CarTypeDTO } from './car-type.dto';
import { CarStatus, CarType } from './car-type.entity';
import { CarTypeRepository } from './car-type.repository';

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

  public async loadDto(id: string): Promise<CarTypeDTO> {
    const carType = await this.load(id);
    const activeCarsCounter = await this.carTypeRepository.findActiveCounter(
      carType.getCarClass(),
    );

    return new CarTypeDTO(carType, activeCarsCounter.getActiveCarsCounter());
  }

  public async create(carTypeDTO: CarTypeDTO): Promise<CarTypeDTO> {
    const byCarClass = await this.carTypeRepository.findByCarClass(
      carTypeDTO.getCarClass(),
    );

    if (!byCarClass) {
      const type = new CarType(
        carTypeDTO.getCarClass(),
        carTypeDTO.getDescription(),
        this.getMinNumberOfCars(carTypeDTO.getCarClass()),
      );
      return this.loadDto(
        await (await this.carTypeRepository.create(type)).getId(),
      );
    } else {
      byCarClass.setDescription(carTypeDTO.getDescription());

      await this.carTypeRepository.updateCarType(byCarClass);

      const carType = await this.carTypeRepository.findByCarClass(
        carTypeDTO.getCarClass(),
      );

      if (!carType) {
        throw new NotFoundException('Cannot find car type');
      }

      return this.loadDto(carType.getId());
    }
  }

  public async activate(id: string) {
    const carType = await this.load(id);

    carType.activate();

    await this.carTypeRepository.updateCarType(carType);
  }

  public async deactivate(id: string) {
    const carType = await this.load(id);

    carType.deactivate();

    await this.carTypeRepository.updateCarType(carType);
  }

  public async registerCar(carClass: CarClass) {
    const carType = await this.findByCarClass(carClass);

    carType.registerCar();

    await this.carTypeRepository.updateCarType(carType);
  }

  public async unregisterCar(carClass: CarClass) {
    const carType = await this.findByCarClass(carClass);

    carType.unregisterCar();

    await this.carTypeRepository.updateCarType(carType);
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
