import { CarClass } from '../car-fleet/car-class.enum';

import { DriverSession } from './driver-session.entity';

export class DriverSessionDTO {
  private loggedAt: number | null;

  private loggedOutAt: number | null;

  private platesNumber: string;

  private carClass: CarClass;

  private carBrand: string;

  public static createFromRawData(
    loggedAt: number,
    loggedOutAt: number,
    platesNumber: string,
    carClass: CarClass,
    carBrand: string,
  ) {
    const session = new DriverSessionDTO(null);
    session.loggedAt = loggedAt;
    session.loggedOutAt = loggedOutAt;
    session.platesNumber = platesNumber;
    session.carClass = carClass;
    session.carBrand = carBrand;
    return session;
  }

  constructor(session: DriverSession | null) {
    if (!session) {
      return this;
    }

    this.carBrand = session.getCarBrand();
    this.platesNumber = session.getPlatesNumber();
    this.loggedAt = session.getLoggedAt();
    this.loggedOutAt = session.getLoggedOutAt();
    this.carClass = session.getCarClass();
  }

  public getCarBrand() {
    return this.carBrand;
  }

  public setCarBrand(carBrand: string) {
    this.carBrand = carBrand;
  }

  public getLoggedAt() {
    return this.loggedAt;
  }

  public setLoggedAt(loggedAt: number) {
    this.loggedAt = loggedAt;
  }

  public getLoggedOutAt() {
    return this.loggedOutAt;
  }

  public setLoggedOutAt(loggedOutAt: number) {
    this.loggedOutAt = loggedOutAt;
  }

  public getPlatesNumber() {
    return this.platesNumber;
  }

  public setPlatesNumber(platesNumber: string) {
    this.platesNumber = platesNumber;
  }

  public getCarClass() {
    return this.carClass;
  }

  public setCarClass(carClass: CarClass) {
    this.carClass = carClass;
  }
}
