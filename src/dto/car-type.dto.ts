import { CarClass, CarStatus, CarType } from '../entity/car-type.entity';

export class CarTypeDto {
  private id: string;

  private carClass: CarClass;

  private description: string;

  private status: CarStatus;

  private carsCounter: number;

  private minNoOfCarsToActivateClass: number;

  private activeCarsCounter: number;

  constructor(carType?: CarType) {
    if (!carType) {
      return this;
    }

    this.id = carType.getId();
    this.carClass = carType.getCarClass();
    this.status = carType.getStatus();
    this.carsCounter = carType.getCarsCounter();
    this.description = carType.getDescription();
    this.minNoOfCarsToActivateClass = carType.getMinNoOfCarsToActivateClass();
    this.activeCarsCounter = carType.getActiveCarsCounter();
  }

  public getId() {
    return this.id;
  }

  public getCarClass() {
    return this.carClass;
  }

  public setCarClass(carClass: CarClass) {
    this.carClass = carClass;
  }

  public getDescription() {
    return this.description;
  }

  public setDescription(description: string) {
    this.description = description;
  }

  public getCarsCounter() {
    return this.carsCounter;
  }

  public getActiveCarsCounter() {
    return this.activeCarsCounter;
  }
}
