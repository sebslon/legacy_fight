import { Column, Entity } from 'typeorm';

import { CarClass } from '../car-fleet/car-class.enum';
import { BaseEntity } from '../common/base.entity';

@Entity()
export class DriverSession extends BaseEntity {
  @Column({ nullable: true, type: 'bigint' })
  public loggedAt: number;

  @Column({ nullable: true, type: 'bigint' })
  private loggedOutAt: number | null;

  @Column({ type: 'uuid' })
  private driverId: string;

  @Column()
  private platesNumber: string;

  @Column()
  private carClass: CarClass;

  @Column()
  private carBrand: string;

  public getLoggedAt() {
    return this.loggedAt;
  }

  public getCarBrand() {
    return this.carBrand;
  }

  public setCarBrand(carBrand: string) {
    this.carBrand = carBrand;
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

  public getDriverId() {
    return this.driverId;
  }

  public setDriverId(driverId: string) {
    this.driverId = driverId;
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
