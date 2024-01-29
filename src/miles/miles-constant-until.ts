import { MilesJSONInterface } from './awarded-miles.entity';
import { MilesInterface } from './interfaces/miles.interface';

export class MilesConstantUntil implements MilesInterface {
  private amount: number;
  private expirationTime: Date | null;

  public static constantUntil(amount: number, expirationTime: Date) {
    return new MilesConstantUntil(amount, expirationTime);
  }

  public static constantForever(amount: number) {
    return new MilesConstantUntil(amount, null);
  }

  public static fromJSON(milesJSON: MilesJSONInterface): MilesInterface {
    return new MilesConstantUntil(
      milesJSON.miles,
      milesJSON.expirationDate ? new Date(milesJSON.expirationDate) : null,
    );
  }

  private constructor(amount: number, expiresAt: Date | null = null) {
    this.amount = amount;
    this.expirationTime = expiresAt;
  }

  public getAmountFor(when: Date): number {
    const isExpired =
      this.expirationTime && when.getTime() > this.expirationTime.getTime();

    if (isExpired) {
      return 0;
    }

    return this.amount || 0;
  }

  public subtract(amount: number, moment: Date): MilesInterface {
    if (this.getAmountFor(moment) < amount) {
      throw new Error('Insufficient amount of miles');
    }

    return new MilesConstantUntil(this.amount - amount, this.expirationTime);
  }

  public expiresAt(): Date | null {
    return this.expirationTime;
  }

  public equals(obj: object) {
    if (obj instanceof MilesConstantUntil) {
      return (
        this.amount === obj.amount && this.expirationTime === obj.expirationTime
      );
    }

    return false;
  }
}
