import { NotAcceptableException } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { orderBy } from 'lodash';
import { Column, Entity, OneToMany } from 'typeorm';

import { BaseEntity } from '../common/base.entity';
import { Clock } from '../common/clock';

import { AwardedMiles } from './awarded-miles.entity';
import { MilesSortingStrategy } from './awards.service';
import { MilesConstantUntil } from './miles/miles-constant-until';

@Entity()
export class AwardsAccount extends BaseEntity {
  @Column({ default: Date.now(), type: 'bigint' })
  private date: number;

  @Column({ default: false, type: 'boolean' })
  private isActive: boolean;

  @Column({ default: 0, type: 'integer' })
  private transactions: number;

  @Column({ type: 'uuid' })
  private clientId: string;

  @OneToMany(() => AwardedMiles, (awardedMiles) => awardedMiles.account, {
    eager: true,
    cascade: true,
  })
  private miles: AwardedMiles[];

  public constructor(clientId: string, isActive: boolean, date: Date) {
    super();

    this.clientId = clientId;
    this.isActive = isActive;
    this.date = date?.getTime();
  }

  public static notActiveAccount(clientId: string, date: Date) {
    return new AwardsAccount(clientId, false, date);
  }

  public addExpiringMiles(
    amount: number,
    expiresAt: Date,
    transitId: string,
    when: Date,
  ) {
    const expiringMiles = new AwardedMiles(
      this,
      transitId,
      this.clientId,
      when,
      MilesConstantUntil.constantUntil(amount, expiresAt),
    );

    this.miles.push(expiringMiles);
    this.transactions++;

    return expiringMiles;
  }

  public addNonExpiringMiles(amount: number, when: Date) {
    const nonExpiringMiles = new AwardedMiles(
      this,
      null,
      this.clientId,
      when,
      MilesConstantUntil.constantForever(amount),
    );

    this.miles.push(nonExpiringMiles);
    this.transactions++;

    return nonExpiringMiles;
  }

  public calculateBalance(at: Date) {
    return this.miles
      .filter((m) => {
        const expiration = m.getExpirationDate();
        const isNotExpired = expiration && Clock.isBefore(at, expiration);

        const isMileValid = m.cantExpire() || isNotExpired;
        return isMileValid;
      })
      .map((m) => m.getMilesAmount(at))
      .reduce((a, b) => a + b, 0);
  }

  public removeMiles(
    miles: number,
    when: Date,
    strategy: MilesSortingStrategy,
  ) {
    const balance = this.calculateBalance(when);

    if (balance >= miles && this.isActive) {
      let milesList = this.miles;

      milesList = orderBy(milesList, strategy.comparators, strategy.orders);

      const now = Clock.currentDate();

      for (const m of milesList) {
        if (miles <= 0) {
          break;
        }

        const cantExpire = m.cantExpire();
        const isNotExpired = m.getExpirationDate()
          ? dayjs(m.getExpirationDate()).isAfter(dayjs())
          : false;

        if (cantExpire || isNotExpired) {
          const milesAmount = m.getMilesAmount(now);

          if (milesAmount <= miles) {
            miles -= milesAmount;
            m.removeAll(now);
          } else {
            m.subtract(miles, now);
            miles = 0;
          }
        }
      }
    } else {
      throw new NotAcceptableException(
        'Insufficient miles, id = ' +
          this.clientId +
          ', miles requested = ' +
          miles,
      );
    }
  }

  public moveMilesTo(accountTo: AwardsAccount, amount: number, when: Date) {
    const balance = this.calculateBalance(when);

    if (balance >= amount && this.isActive) {
      for (const m of this.miles) {
        if (amount <= 0) {
          break;
        }

        const expiration = m.getExpirationDate();

        if (
          m.cantExpire() ||
          (expiration && Clock.isBefore(when, expiration))
        ) {
          const milesAmount = m.getMilesAmount(when);

          if (milesAmount <= amount) {
            this.miles.splice(this.miles.indexOf(m), 1);

            m.transferTo(accountTo, milesAmount);

            amount -= milesAmount;
          } else {
            const amountToTransfer = amount;
            amount -= m.getMilesAmount(when);

            m.transferTo(accountTo, amountToTransfer);
            m.subtract(amountToTransfer, when);
          }
        }
      }

      this.transactions++;
      accountTo.transactions++;
    }
  }

  public activate() {
    this.isActive = true;
  }

  public deactivate() {
    this.isActive = false;
  }

  public increaseTransactions() {
    this.transactions++;
  }

  public getMiles(): readonly AwardedMiles[] {
    return Object.freeze(this.miles);
  }

  public getClientId() {
    return this.clientId;
  }

  public isAwardActive() {
    return this.isActive;
  }

  public getTransactions() {
    return this.transactions;
  }

  public getDate() {
    return this.date;
  }
}
