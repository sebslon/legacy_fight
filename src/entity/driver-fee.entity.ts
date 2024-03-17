import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

import { BaseEntity } from '../common/base.entity';
import { Money } from '../money/money';

import { Driver } from './driver.entity';

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
  @JoinColumn({ name: 'driverId' })
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

  public setAmount(amount: number) {
    this.amount = amount;
  }

  public setMin(min: number) {
    this.min = new Money(min);
  }

  public calculateDriverFee(transitPrice: Money): Money {
    let finalFee: Money;

    if (this.feeType === FeeType.FLAT) {
      finalFee = transitPrice.subtract(new Money(this.amount));
    } else {
      finalFee = transitPrice.percentage(this.amount);
    }

    return new Money(
      Math.max(finalFee.toInt(), this.min == null ? 0 : this.min.toInt()),
    );
  }
}
