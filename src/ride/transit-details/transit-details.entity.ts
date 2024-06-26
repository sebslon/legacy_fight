import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { AssignmentStatus } from '../../assignment/assignment-status.enum';
import { InvolvedDriversSummary } from '../../assignment/involved-drivers-summary';
import { CarClass } from '../../car-fleet/car-class.enum';
import { Client } from '../../crm/client.entity';
import { Address } from '../../geolocation/address/address.entity';
import { Distance } from '../../geolocation/distance';
import { Money } from '../../money/money';
import { Tariff } from '../../pricing/tariff';
import { TransitStatus } from '../transit.entity';

@Entity()
export class TransitDetails {
  @PrimaryColumn({ type: 'uuid' })
  private requestUUID: string;

  @Column({ nullable: true, type: 'uuid' })
  private transitId: string;

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

  @Column({ nullable: true, type: 'uuid' })
  public driverId: string;

  @Column()
  private status: TransitStatus = TransitStatus.DRAFT;

  @Column({
    transformer: {
      to: (value: Tariff) => JSON.stringify(value),
      from: (value: string) => {
        const parsed = JSON.parse(value);
        return Tariff.create(
          parsed.kmRate,
          parsed.name,
          new Money(parsed.baseFee?.value),
        );
      },
    },
    type: 'jsonb',
  })
  private tariff: Tariff;

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
    requestUUID: string,
    from: Address,
    to: Address,
    distance: Distance,
    client: Client,
    carClass: CarClass,
    estimatedPrice: Money,
    tariff: Tariff,
  ) {
    // super();

    this.requestUUID = requestUUID;
    this.dateTime = dateTime?.getTime();
    this.from = from;
    this.to = to;
    this.distance = distance;
    this.client = client;
    this.carType = carClass;
    this.estimatedPrice = estimatedPrice;
    this.tariff = tariff;
  }

  public started(startedAt: Date, transitId: string): void {
    this.startedAt = startedAt.getTime();
    this.status = TransitStatus.IN_TRANSIT;
    this.transitId = transitId;
  }

  public accepted(when: Date, driverId: string): void {
    this.acceptedAt = when.getTime();
    this.driverId = driverId;
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

  public involvedDriversAre(involvedDriversSummary: InvolvedDriversSummary) {
    if (
      involvedDriversSummary.assignmentStatus ===
      AssignmentStatus.DRIVER_ASSIGNMENT_FAILED
    ) {
      this.status = TransitStatus.DRIVER_ASSIGNMENT_FAILED;
    } else {
      this.status = TransitStatus.TRANSIT_TO_PASSENGER;
    }
  }

  public getRequestUUID(): string {
    return this.requestUUID;
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
