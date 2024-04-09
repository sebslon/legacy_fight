import { DayOfWeek } from '../common/day-of-week.constant';
import { Month } from '../common/month';
import { Distance } from '../geolocation/distance';
import { Money } from '../money/money';

export class Tariff {
  private static readonly BASE_FEE = 8;

  private kmRate: number;
  private name: string;
  private baseFee: Money;

  private constructor(kmRate: number, name: string, baseFee: Money) {
    this.kmRate = kmRate;
    this.name = name;
    this.baseFee = baseFee;
  }

  public static create(kmRate: number, name: string, baseFee: Money): Tariff {
    return new Tariff(kmRate, name, baseFee);
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
      return new Tariff(3.5, 'Sylwester', new Money((this.BASE_FEE + 3) * 100));
    } else {
      if (
        (weekDay == DayOfWeek.FRIDAY && hour >= 17) ||
        (weekDay == DayOfWeek.SATURDAY && hour <= 6) ||
        (weekDay == DayOfWeek.SATURDAY && hour >= 17) ||
        (weekDay == DayOfWeek.SUNDAY && hour <= 6)
      ) {
        return new Tariff(
          2.5,
          'Weekend+',
          new Money((this.BASE_FEE + 2) * 100),
        );
      } else {
        if (
          (weekDay == DayOfWeek.SATURDAY && hour > 6 && hour < 17) ||
          (weekDay == DayOfWeek.SUNDAY && hour > 6)
        ) {
          return new Tariff(1.5, 'Weekend', new Money(this.BASE_FEE * 100));
        } else {
          return new Tariff(
            1.0,
            'Standard',
            new Money((this.BASE_FEE + 1) * 100),
          );
        }
      }
    }
  }

  public calculateCost(distance: Distance): Money {
    const priceBigDecimal =
      Number((distance.toKmInFloat() * this.kmRate).toFixed(2)) * 100;

    return new Money(priceBigDecimal).add(this.baseFee);
  }

  public getName(): string {
    return this.name;
  }

  public getKmRate(): number {
    return this.kmRate;
  }

  public getBaseFee(): number {
    return this.baseFee.toInt();
  }
}
