import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from '../common/base.entity';
import { Clock } from '../common/clock';
import { Client } from '../entity/client.entity';
import { Transit } from '../entity/transit/transit.entity';

import { AwardsAccount } from './awards-account.entity';
import { MilesInterface } from './interfaces/miles.interface';
import { MilesConstantUntil } from './miles-constant-until';

export interface MilesJSONInterface {
  miles: number;
  expirationDate: string;
}

@Entity()
export class AwardedMiles extends BaseEntity {
  @ManyToOne(() => Client)
  @JoinColumn()
  public client: Client;

  @Column({
    type: 'jsonb',
    default: { miles: 0, expirationDate: null },
    transformer: {
      from: (value: MilesJSONInterface) => MilesConstantUntil.fromJSON(value),
      to: (value: MilesInterface) => ({
        miles: value.getAmountFor(Clock.currentDate()),
        expirationDate: value.expiresAt(),
      }),
    },
  })
  private milesJSON: MilesInterface;

  @Column({ default: Date.now(), type: 'bigint', nullable: false })
  private date: number;

  @ManyToOne(() => Transit)
  public transit: Transit | null;

  @ManyToOne(() => AwardsAccount)
  public account: AwardsAccount;

  public constructor(
    awardsAccount: AwardsAccount,
    transit: Transit | null,
    client: Client,
    when: Date,
    miles: MilesInterface,
  ) {
    super();

    this.account = awardsAccount;
    this.transit = transit;
    this.client = client;
    this.date = when?.getTime();

    this.setMiles(miles);
  }

  public transferTo(account: AwardsAccount, amount: number) {
    const expiration = this.getExpirationDate();
    const transit = this.transit;

    expiration && transit
      ? account.addExpiringMiles(
          amount,
          expiration,
          transit,
          Clock.currentDate(),
        )
      : account.addNonExpiringMiles(amount, Clock.currentDate());
  }

  public removeAll(forWhen: Date) {
    this.setMiles(
      this.getMiles().subtract(this.getMilesAmount(forWhen), forWhen),
    );
  }

  public subtract(miles: number, forWhen: Date) {
    this.setMiles(this.getMiles().subtract(miles, forWhen));
  }

  public getClient() {
    return this.client;
  }

  public getMiles(): MilesInterface {
    return this.milesJSON;
  }

  public getMilesAmount(when: Date) {
    return this.getMiles().getAmountFor(when);
  }

  public getDate() {
    return this.date;
  }

  public getExpirationDate() {
    return this.getMiles().expiresAt();
  }

  public cantExpire() {
    return this.getExpirationDate() == null;
  }

  private setMiles(miles: MilesInterface) {
    this.milesJSON = miles;
  }
}
