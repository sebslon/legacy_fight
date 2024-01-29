import { ForbiddenException } from '@nestjs/common';

import { Clock } from '../common/clock';

import { MilesInterface } from './interfaces/miles.interface';

export class MilesTwoStepExpiring implements MilesInterface {
  private amount: number;
  private expirationDate: Date;
  private whenFirstHalfExpires: Date;

  constructor(amount: number, whenFirstHalfExpires: Date, whenExpires: Date) {
    this.amount = amount;
    this.whenFirstHalfExpires = whenFirstHalfExpires;
    this.expirationDate = whenExpires;
  }

  public getAmountFor(moment: Date): number {
    if (!Clock.isBefore(this.whenFirstHalfExpires, moment)) {
      return this.amount;
    }

    if (!Clock.isBefore(this.expirationDate, moment)) {
      return this.amount - this.halfOf(this.amount);
    }

    return 0;
  }

  public subtract(amount: number, moment: Date): MilesInterface {
    const currentAmount = this.getAmountFor(moment);

    if (amount > currentAmount) {
      throw new ForbiddenException('Cannot subtract more miles than available');
    }

    return new MilesTwoStepExpiring(
      currentAmount - amount,
      this.whenFirstHalfExpires,
      this.expirationDate,
    );
  }

  public expiresAt(): Date {
    return this.expirationDate;
  }

  private halfOf(amount: number): number {
    return Math.floor(amount / 2);
  }
}
