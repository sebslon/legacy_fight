import { Column, Entity, ManyToOne } from 'typeorm';

import { BaseEntity } from '../common/base.entity';
import { Client } from '../entity/client.entity';
import { Transit } from '../entity/transit.entity';

import { MilesConstantUntil } from './miles-constant-until';
import { MilesInterface } from './miles.interface';

export interface MilesJSONInterface {
  miles: number;
  expirationDate: string;
}

@Entity()
export class AwardedMiles extends BaseEntity {
  @ManyToOne(() => Client)
  public client: Client;

  @Column({
    type: 'jsonb',
    default: { miles: 0, expirationDate: null },
    transformer: {
      from: (value: MilesJSONInterface) => MilesConstantUntil.fromJSON(value),
      to: (value: MilesInterface) => ({
        miles: value.getAmountFor(new Date(Date.now())),
        expirationDate: value.expiresAt(),
      }),
    },
  })
  private milesJSON: MilesInterface;

  @Column({ default: Date.now(), type: 'bigint', nullable: false })
  private date: number;

  @ManyToOne(() => Transit)
  public transit: Transit | null;

  public getClient() {
    return this.client;
  }

  public setClient(client: Client) {
    this.client = client;
  }

  public getMiles(): MilesInterface {
    return this.milesJSON;
  }

  public getMilesAmount(when: Date) {
    return this.getMiles().getAmountFor(when);
  }

  public setMiles(miles: MilesInterface) {
    this.milesJSON = miles;
  }

  public getDate() {
    return this.date;
  }

  public setDate(date: number) {
    this.date = date;
  }

  public getExpirationDate() {
    return this.getMiles().expiresAt();
  }

  public cantExpire() {
    return this.getExpirationDate() == null;
  }

  public setTransit(transit: Transit | null) {
    this.transit = transit;
  }

  public removeAll(forWhen: Date) {
    this.setMiles(
      this.getMiles().subtract(this.getMilesAmount(forWhen), forWhen),
    );
  }

  public subtract(miles: number, forWhen: Date) {
    this.setMiles(this.getMiles().subtract(miles, forWhen));
  }
}
