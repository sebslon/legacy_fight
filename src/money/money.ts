export class Money {
  private value: number;
  public static ZERO = new Money(0);

  constructor(value: number) {
    this.value = value;
  }

  public add(money: Money): Money {
    return new Money(this.value + money.value);
  }

  public subtract(money: Money): Money {
    return new Money(this.value - money.value);
  }

  public percentage(percent: number): Money {
    return new Money(Math.round(this.value * (percent / 100)));
  }

  public equals(money: Money): boolean {
    if (this === money) {
      return true;
    }

    if (!money || money.constructor !== this.constructor) {
      return false;
    }

    return this.value === money.value;
  }

  public toString() {
    const value = this.value.toFixed(2);

    return `${value}`;
  }

  public toInt(): number {
    return this.value;
  }
}
