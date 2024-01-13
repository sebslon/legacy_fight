import { ForbiddenException } from '@nestjs/common';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
} from 'typeorm';

import { BaseEntity } from '../common/base.entity';
import { Distance } from '../distance/distance';
import { Money } from '../money/money';

import { Address } from './address.entity';
import { CarClass } from './car-type.entity';
import { Client, PaymentType } from './client.entity';
import { Driver } from './driver.entity';
import { Tariff } from './tariff.entity';

export enum TransitStatus {
  DRAFT = 'draft',
  CANCELLED = 'cancelled',
  WAITING_FOR_DRIVER_ASSIGNMENT = 'waiting_for_driver_assignment',
  DRIVER_ASSIGNMENT_FAILED = 'driver_assignment_failed',
  TRANSIT_TO_PASSENGER = 'transit_to_passenger',
  IN_TRANSIT = 'in_transit',
  COMPLETED = 'completed',
}

export enum DriverPaymentStatus {
  NOT_PAID = 'not_paid',
  PAID = 'paid',
  CLAIMED = 'claimed',
  RETURNED = 'returned',
}

export enum ClientPaymentStatus {
  NOT_PAID = 'not_paid',
  PAID = 'paid',
  RETURNED = 'returned',
}

export enum Month {
  JANUARY,
  FEBRUARY,
  MARCH,
  APRIL,
  MAY,
  JUNE,
  JULY,
  AUGUST,
  SEPTEMBER,
  OCTOBER,
  NOVEMBER,
  DECEMBER,
}

export enum DayOfWeek {
  SUNDAY,
  MONDAY,
  TUESDAY,
  WEDNESDAY,
  THURSDAY,
  FRIDAY,
  SATURDAY,
}

@Entity()
export class Transit extends BaseEntity {
  @ManyToOne(() => Driver, (driver) => driver.transits, { eager: true })
  public driver: Driver | null;

  @OneToOne(() => Tariff, { eager: true, cascade: true })
  @JoinColumn()
  public tariff: Tariff;

  @Column({ nullable: true })
  private driverPaymentStatus: DriverPaymentStatus;

  @Column({ nullable: true })
  private clientPaymentStatus: ClientPaymentStatus;

  @Column({ nullable: true })
  private paymentType: PaymentType;

  @Column()
  private status: TransitStatus;

  @Column({ type: 'bigint', nullable: true })
  private date: number;

  @ManyToOne(() => Address, { eager: true })
  @JoinColumn()
  private from: Address;

  @ManyToOne(() => Address, { eager: true })
  @JoinColumn()
  private to: Address;

  @Column({ nullable: true, type: 'bigint' })
  public acceptedAt: number | null;

  @Column({ nullable: true, type: 'bigint' })
  public started: number | null;

  @Column({ default: 0 })
  public pickupAddressChangeCounter: number;

  @ManyToMany(() => Driver, { eager: true })
  @JoinTable()
  public driversRejections: Driver[];

  @ManyToMany(() => Driver, { eager: true })
  @JoinTable()
  public proposedDrivers: Driver[];

  @Column({ default: 0, type: 'integer' })
  public awaitingDriversResponses: number;

  @Column({ nullable: false, default: 0 })
  private km: number;

  // https://stackoverflow.com/questions/37107123/sould-i-store-price-as-decimal-or-integer-in-mysql
  @Column({
    nullable: true,
    type: 'integer',
    transformer: {
      to: (value: Money) => value?.toInt(),
      from: (value: number) => new Money(value),
    },
  })
  private price: Money | null;

  @Column({
    nullable: true,
    type: 'integer',
    transformer: {
      to: (value: Money) => value?.toInt(),
      from: (value: number) => new Money(value),
    },
  })
  private estimatedPrice: Money | null;

  @Column({
    nullable: true,
    type: 'integer',
    transformer: {
      to: (value: Money) => value?.toInt(),
      from: (value: number) => new Money(value),
    },
  })
  private driversFee: Money;

  @Column({ type: 'bigint', nullable: true })
  public dateTime: number;

  @Column({ type: 'bigint', nullable: true })
  private published: number;

  @ManyToOne(() => Client, { eager: true })
  @JoinColumn()
  private client: Client;

  @Column()
  private carType: CarClass;

  @Column({ type: 'bigint', nullable: true })
  private completeAt: number;

  public getTariff() {
    return this.tariff;
  }

  public getCarType() {
    return this.carType as CarClass;
  }

  public setCarType(carType: CarClass) {
    this.carType = carType;
  }

  public getDriver() {
    return this.driver;
  }

  public getPrice() {
    return this.price;
  }

  //just for testing
  public setPrice(price: Money) {
    this.price = price;
  }

  public getStatus() {
    return this.status;
  }

  public setStatus(status: TransitStatus) {
    this.status = status;
  }

  public getCompleteAt() {
    return this.completeAt;
  }

  public getClient() {
    return this.client;
  }

  public setClient(client: Client) {
    this.client = client;
  }

  public setDateTime(dateTime: number) {
    this.tariff = Tariff.ofTime(new Date(dateTime));
    this.dateTime = dateTime;
  }

  public getDateTime() {
    return this.dateTime;
  }

  public getPublished() {
    return this.published;
  }

  public setPublished(published: number) {
    this.published = published;
  }

  public setDriver(driver: Driver | null) {
    this.driver = driver;
  }

  public getKm() {
    return Distance.fromKm(this.km);
  }

  public setKm(distance: Distance) {
    this.km = distance.toKmInFloat();
    this.estimateCost();
  }

  public getAwaitingDriversResponses() {
    return this.awaitingDriversResponses;
  }

  public setAwaitingDriversResponses(proposedDriversCounter: number) {
    this.awaitingDriversResponses = proposedDriversCounter;
  }

  public getDriversRejections() {
    return this.driversRejections || [];
  }

  public setDriversRejections(driversRejections: Driver[]) {
    this.driversRejections = driversRejections;
  }

  public getProposedDrivers() {
    return this.proposedDrivers || [];
  }

  public setProposedDrivers(proposedDrivers: Driver[]) {
    this.proposedDrivers = proposedDrivers;
  }

  public getAcceptedAt() {
    return this.acceptedAt;
  }

  public setAcceptedAt(acceptedAt: number) {
    this.acceptedAt = acceptedAt;
  }

  public getStarted() {
    return this.started;
  }

  public setStarted(started: number) {
    this.started = started;
  }

  public getFrom() {
    return this.from;
  }

  public setFrom(from: Address) {
    this.from = from;
  }

  public getTo() {
    return this.to;
  }

  public setTo(to: Address) {
    this.to = to;
  }

  public getPickupAddressChangeCounter() {
    return this.pickupAddressChangeCounter;
  }

  public setPickupAddressChangeCounter(pickupChanges: number) {
    this.pickupAddressChangeCounter = pickupChanges;
  }

  public setCompleteAt(when: number) {
    this.completeAt = when;
  }

  public getDriversFee() {
    return this.driversFee;
  }

  public setDriversFee(driversFee: number) {
    this.driversFee = new Money(driversFee);
  }

  public getEstimatedPrice() {
    return this.estimatedPrice;
  }

  public setEstimatedPrice(estimatedPrice: number) {
    this.estimatedPrice = new Money(estimatedPrice);
  }

  public estimateCost() {
    if (this.status === TransitStatus.COMPLETED) {
      throw new ForbiddenException(
        'Estimating cost for completed transit is forbidden, id = ' +
          this.getId(),
      );
    }

    this.estimatedPrice = this.calculateCost();

    this.price = null;

    return this.estimatedPrice;
  }

  public calculateFinalCosts(): Money {
    if (this.status === TransitStatus.COMPLETED) {
      return this.calculateCost();
    } else {
      throw new ForbiddenException(
        'Cannot calculate final cost if the transit is not completed',
      );
    }
  }

  private calculateCost(): Money {
    return this.tariff.calculateCost(this.getKm());
  }
}
