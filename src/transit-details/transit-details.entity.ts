import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
  RelationId,
} from 'typeorm';

import { Distance } from '../distance/distance';
import { Address } from '../entity/address.entity';
import { CarClass } from '../entity/car-type.entity';
import { Client } from '../entity/client.entity';
import { Driver } from '../entity/driver.entity';
import { Tariff } from '../entity/tariff.entity';
import { Transit, TransitStatus } from '../entity/transit/transit.entity';
import { Money } from '../money/money';

@Entity()
export class TransitDetails {
  @Column({ type: 'bigint', nullable: true })
  private dateTime: number | null;

  @Column({ nullable: true, type: 'bigint' })
  private completeAt: number | null;

  @Column()
  private carType: CarClass;

  @Column({
    transformer: {
      to: (value: Distance) => value.toKmInFloat(),
      from: (value: number) => Distance.fromKm(value),
    },
    type: 'float',
  })
  private distance: Distance;

  @Column({ nullable: true, type: 'bigint' })
  private startedAt: number;

  @Column({ nullable: true, type: 'bigint' })
  private acceptedAt: number;

  @Column({ nullable: true, type: 'bigint' })
  private publishedAt: number;

  @Column({
    nullable: true,
    transformer: {
      to: (value: Money) => (value ? value.toInt() : null),
      from: (value: number) => new Money(value),
    },
    type: 'int',
  })
  private price: Money;

  @Column({
    nullable: true,
    transformer: {
      to: (value: Money) => (value ? value.toInt() : null),
      from: (value: number) => new Money(value),
    },
    type: 'int',
  })
  private estimatedPrice: Money;

  @Column({
    nullable: true,
    transformer: {
      to: (value: Money) => (value ? value.toInt() : null),
      from: (value: number) => new Money(value),
    },
    type: 'int',
  })
  private driversFee: Money;

  @ManyToOne(() => Driver, { eager: true })
  @JoinColumn({ name: 'driverId', referencedColumnName: 'id' })
  public driver: Driver;

  @RelationId((transitDetails: TransitDetails) => transitDetails.driver)
  private driverId: string;

  @Column()
  private status: TransitStatus = TransitStatus.DRAFT;

  @ManyToOne(() => Tariff, { eager: true })
  @JoinColumn({ name: 'tariffId' })
  private tariff: Tariff;

  @OneToOne(() => Transit, (t) => t.transitDetails)
  @JoinColumn({ name: 'transitId' })
  public transit: Transit;
  @PrimaryColumn()
  private transitId: string;

  @ManyToOne(() => Address, { eager: true })
  @JoinColumn({ name: 'fromHash', referencedColumnName: 'hash' })
  public from: Address;

  @ManyToOne(() => Address, { eager: true })
  @JoinColumn({ name: 'toHash', referencedColumnName: 'hash' })
  public to: Address;

  @ManyToOne(() => Client, { eager: true })
  @JoinColumn({ name: 'clientId', referencedColumnName: 'id' })
  public client: Client;

  public constructor(
    dateTime: Date,
    transitId: string,
    from: Address,
    to: Address,
    distance: Distance,
    client: Client,
    carClass: CarClass,
    estimatedPrice: Money,
    tariff: Tariff,
  ) {
    // super();

    this.transitId = transitId;
    this.dateTime = dateTime?.getTime();
    this.from = from;
    this.to = to;
    this.distance = distance;
    this.client = client;
    this.carType = carClass;
    this.estimatedPrice = estimatedPrice;
    this.tariff = tariff;
  }

  public started(startedAt: Date): void {
    this.startedAt = startedAt.getTime();
    this.status = TransitStatus.IN_TRANSIT;
  }

  public accepted(when: Date, driver: Driver): void {
    this.acceptedAt = when.getTime();
    this.driver = driver;
    this.status = TransitStatus.TRANSIT_TO_PASSENGER;
  }

  public published(when: Date): void {
    this.publishedAt = when.getTime();
    this.status = TransitStatus.WAITING_FOR_DRIVER_ASSIGNMENT;
  }

  public cancelled(): void {
    this.status = TransitStatus.CANCELLED;
  }

  public completed(when: Date, price: Money, driverFee: Money): void {
    this.completeAt = when.getTime();
    this.price = price;
    this.driversFee = driverFee;
    this.status = TransitStatus.COMPLETED;
  }

  public pickupChangedTo(newAddress: Address, distance: Distance) {
    this.from = newAddress;
    this.distance = distance;
  }

  public destinationChangedTo(newAddress: Address, distance: Distance) {
    this.to = newAddress;
    this.distance = distance;
  }

  public getDateTime(): number | null {
    return this.dateTime;
  }

  public getCompleteAt(): number | null {
    return this.completeAt;
  }

  public getClient(): Client {
    return this.client;
  }

  public getCarType(): CarClass {
    return this.carType;
  }

  public getFrom(): Address {
    return this.from;
  }

  public getTo(): Address {
    return this.to;
  }

  public getStartedAt(): number | null {
    return this.startedAt;
  }

  public getAcceptedAt(): number | null {
    return this.acceptedAt;
  }

  public getDriversFee(): Money {
    return this.driversFee;
  }

  public getPrice(): Money {
    return this.price;
  }

  public getEstimatedPrice(): Money {
    return this.estimatedPrice;
  }

  public getDistance(): Distance {
    return this.distance;
  }

  public getTransitId(): string {
    return this.transitId;
  }

  public getTariff(): Tariff | null {
    return this.tariff || null;
  }

  public getDriverId(): string {
    return this.driverId;
  }

  public getStatus(): TransitStatus {
    return this.status;
  }

  public getPublishedAt(): number | null {
    return this.publishedAt;
  }

  public getBaseFee(): number | null {
    if (!this.tariff) return null;
    return this.tariff.getBaseFee();
  }

  public getKmRate(): number | null {
    if (!this.tariff) return null;
    return this.tariff.getKmRate();
  }
}
