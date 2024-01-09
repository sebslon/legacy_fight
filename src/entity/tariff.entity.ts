import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../common/base.entity';
import { Distance } from '../distance/distance';
import { Money } from '../money/money';

import { DayOfWeek, Month } from './transit.entity';

@Entity()
export class Tariff extends BaseEntity {
  private static readonly BASE_FEE = 8;

  @Column({ type: 'float' })
  private kmRate: number;

  @Column()
  private name: string;

  @Column({ type: 'float' })
  private baseFee: number;

  private constructor(kmRate: number, name: string, baseFee: number) {
    super();
    this.kmRate = kmRate;
    this.name = name;
    this.baseFee = baseFee;
  }

  public static ofTime(time: Date): Tariff {
    const date = new Date(time);

    const month = date.getMonth();
    const weekDay = date.getDay();
    const monthDay = date.getDate();
    const hour = date.getHours();

    if (
      (month == Month.DECEMBER && monthDay == 31) ||
      (month == Month.JANUARY && monthDay == 1 && hour <= 6)
    ) {
      return new Tariff(3.5, 'Sylwester', this.BASE_FEE + 3);
    } else {
      if (
        (weekDay == DayOfWeek.FRIDAY && hour >= 17) ||
        (weekDay == DayOfWeek.SATURDAY && hour <= 6) ||
        (weekDay == DayOfWeek.SATURDAY && hour >= 17) ||
        (weekDay == DayOfWeek.SUNDAY && hour <= 6)
      ) {
        return new Tariff(2.5, 'Weekend+', this.BASE_FEE + 2);
      } else {
        if (
          (weekDay == DayOfWeek.SATURDAY && hour > 6 && hour < 17) ||
          (weekDay == DayOfWeek.SUNDAY && hour > 6)
        ) {
          return new Tariff(1.5, 'Weekend', this.BASE_FEE);
        } else {
          return new Tariff(1.0, 'Standard', this.BASE_FEE + 1);
        }
      }
    }
  }

  public calculateCost(distance: Distance): Money {
    const priceBigDecimal =
      Number((distance.toKmInFloat() * this.kmRate + this.baseFee).toFixed(2)) *
      100;

    return new Money(priceBigDecimal);
  }

  public getName(): string {
    return this.name;
  }

  public getKmRate(): number {
    return this.kmRate;
  }

  public getBaseFee(): number {
    return this.baseFee;
  }
}
