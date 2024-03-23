import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from '../common/base.entity';

import { DriverAttributeName } from './driver-attribute-name.enum';
import { Driver } from './driver.entity';

@Entity()
export class DriverAttribute extends BaseEntity {
  @Column()
  private name: DriverAttributeName;

  @Column()
  private value: string;

  @ManyToOne(() => Driver, (driver) => driver)
  @JoinColumn({ name: 'driverId' })
  public driver: Driver;

  constructor(driver: Driver, attr: DriverAttributeName, value: string) {
    super();
    this.driver = driver;
    this.name = attr;
    this.value = value;
  }

  public getName() {
    return this.name;
  }

  public setName(name: DriverAttributeName) {
    this.name = name;
  }

  public getValue() {
    return this.value;
  }

  public setValue(value: string) {
    this.value = value;
  }

  public getDriver() {
    return this.driver;
  }

  public setDriver(driver: Driver) {
    this.driver = driver;
  }
}
