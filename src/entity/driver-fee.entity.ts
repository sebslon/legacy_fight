import { Column, Entity, OneToOne } from 'typeorm';

import { BaseEntity } from '../common/base.entity';
import { Driver } from './driver.entity';
import { Money } from '../money/money';

export enum FeeType {
  FLAT = 'flat',
  PERCENTAGE = 'percentage',
}

@Entity()
export class DriverFee extends BaseEntity {
  @Column()
  private feeType: FeeType;

  @Column()
  private amount: number;

  @Column({
    default: 0,
    type: 'integer',
    transformer: {
      to: (value: Money) => value?.toInt(),
      from: (value: number) => new Money(value),
    },
  })
  private min: Money;

  @OneToOne(() => Driver, (driver) => driver.fee, {
    onDelete: 'SET NULL',
  })
  public driver: Driver;

  constructor(feeType: FeeType, driver: Driver, amount: number, min: number) {
    super();
    this.feeType = feeType;
    this.driver = driver;
    this.amount = amount;
    this.min = new Money(min);
  }

  public getFeeType() {
    return this.feeType;
  }

  public setFeeType(feeType: FeeType) {
    this.feeType = feeType;
  }

  public getDriver() {
    return this.driver;
  }

  public setDriver(driver: Driver) {
    this.driver = driver;
  }

  public getAmount() {
    return this.amount;
  }

  public setAmount(amount: number) {
    this.amount = amount;
  }

  public getMin() {
    return this.min;
  }

  public setMin(min: number) {
    this.min = new Money(min);
  }
}
