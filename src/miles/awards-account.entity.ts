import { NotAcceptableException } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { orderBy } from 'lodash';
import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';

import { BaseEntity } from '../common/base.entity';
import { Clock } from '../common/clock';
import { Client, Type } from '../entity/client.entity';
import { Transit } from '../entity/transit.entity';

import { AwardedMiles } from './awarded-miles.entity';
import { MilesConstantUntil } from './miles-constant-until';

@Entity()
export class AwardsAccount extends BaseEntity {
  @Column({ default: Date.now(), type: 'bigint' })
  private date: number;

  @Column({ default: false, type: 'boolean' })
  private isActive: boolean;

  @Column({ default: 0, type: 'integer' })
  private transactions: number;

  @OneToOne(() => Client, { eager: true })
  @JoinColumn()
  private client: Client;

  @OneToMany(() => AwardedMiles, (awardedMiles) => awardedMiles.account, {
    eager: true,
    cascade: true,
  })
  private miles: AwardedMiles[];

  public constructor(client: Client, isActive: boolean, date: Date) {
    super();

    this.client = client;
    this.isActive = isActive;
    this.date = date?.getTime();
  }

  public static notActiveAccount(client: Client, date: Date) {
    return new AwardsAccount(client, false, date);
  }

  public addExpiringMiles(
    amount: number,
    expiresAt: Date,
    transit: Transit,
    when: Date,
  ) {
    const expiringMiles = new AwardedMiles(
      this,
      transit,
      this.client,
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
      this.client,
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
    transitsCounter: number,
    claimsCounter: number,
    clientType: Type,
    isSunday: boolean,
  ) {
    const balance = this.calculateBalance(when);

    if (balance >= miles && this.isActive) {
      let milesList = this.miles;

      if (claimsCounter >= 3) {
        milesList = orderBy(
          milesList,
          [(m) => m.getExpirationDate() ?? m.getExpirationDate()?.getTime()],
          ['desc', 'asc'],
        );
      } else if (clientType === Type.VIP) {
        milesList = orderBy(milesList, [
          (m) => m.cantExpire(),
          (m) => m.getExpirationDate() ?? m.getExpirationDate()?.getTime(),
        ]);
      } else if (transitsCounter >= 15 && isSunday) {
        milesList = orderBy(milesList, [
          (m) => m.cantExpire(),
          (m) => m.getExpirationDate() ?? m.getExpirationDate()?.getTime(),
        ]);
      } else if (transitsCounter >= 15) {
        milesList = orderBy(milesList, [
          (m) => m.cantExpire(),
          (m) => m.getDate(),
        ]);
      } else {
        milesList = orderBy(milesList, (m) => m.getDate());
      }

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
          this.client.getId() +
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

  public getClient() {
    return this.client;
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
