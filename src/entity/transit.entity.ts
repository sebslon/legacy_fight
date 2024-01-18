import { ForbiddenException, NotAcceptableException } from '@nestjs/common';
import * as dayjs from 'dayjs';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';

import { BaseEntity } from '../common/base.entity';
import { Distance } from '../distance/distance';
import { Money } from '../money/money';

import { Address } from './address.entity';
import { CarClass } from './car-type.entity';
import { Claim } from './claim.entity';
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
  @ManyToOne(() => Driver, (driver) => driver.transits, {
    eager: true,
  })
  @JoinColumn()
  public driver: Driver | null;

  @OneToMany(() => Claim, (claim) => claim.transit)
  public claims: Claim[];

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

  private constructor(
    from: Address,
    to: Address,
    client: Client,
    carClass: CarClass,
    dateTime: number,
    distance: Distance,
    status: TransitStatus = TransitStatus.DRAFT,
  ) {
    super();

    this.from = from;
    this.to = to;
    this.client = client;
    this.carType = carClass;
    this.setDateTime(dateTime);
    this.km = distance?.toKmInFloat();
    this.status = status;
  }

  public static create(
    from: Address,
    to: Address,
    client: Client,
    carClass: CarClass,
    dateTime: number,
    distance: Distance,
    status: TransitStatus = TransitStatus.DRAFT,
  ) {
    const transit = new Transit(
      from,
      to,
      client,
      carClass,
      dateTime,
      distance,
      status,
    );

    transit.driversRejections = [];
    transit.proposedDrivers = [];
    transit.pickupAddressChangeCounter = 0;
    transit.price = null;
    transit.acceptedAt = null;

    return transit;
  }

  public completeTransitAt(
    when: Date,
    destinationAddress: Address,
    distance: Distance,
  ) {
    if (this.status === TransitStatus.IN_TRANSIT) {
      this.km = distance.toKmInFloat();
      this.estimateCost();
      this.completeAt = when.getTime();
      this.to = destinationAddress;
      this.status = TransitStatus.COMPLETED;
      this.calculateFinalCosts();
    } else {
      throw new NotAcceptableException(
        'Cannot complete transit, id = ' + this.getId(),
      );
    }
  }

  public rejectBy(driver: Driver) {
    this.driversRejections.push(driver);
    this.awaitingDriversResponses = this.awaitingDriversResponses - 1;
  }

  public acceptBy(driver: Driver, when: Date) {
    if (this.driver) {
      throw new NotAcceptableException(
        'Transit already accepted, id = ' + this.getId(),
      );
    } else {
      if (!this.proposedDrivers.some((d) => d.getId() === driver.getId())) {
        throw new NotAcceptableException(
          'Driver out of possible drivers, id = ' + this.getId(),
        );
      }

      if (this.driversRejections.some((d) => d.getId() === driver.getId())) {
        throw new NotAcceptableException(
          'Driver out of possible drivers, id = ' + this.getId(),
        );
      }

      this.driver = driver;
      this.driver.setOccupied(true);
      this.awaitingDriversResponses = 0;
      this.acceptedAt = when.getTime();
      this.status = TransitStatus.TRANSIT_TO_PASSENGER;
    }

    return this;
  }

  public canProposeTo(driver: Driver) {
    return !this.driversRejections.some((d) => d.getId() === driver.getId());
  }

  public proposeTo(driver: Driver) {
    if (this.canProposeTo(driver)) {
      this.proposedDrivers.push(driver);
      this.awaitingDriversResponses = this.awaitingDriversResponses + 1;
    }
  }

  public failDriverAssignment() {
    this.status = TransitStatus.DRIVER_ASSIGNMENT_FAILED;
    this.driver = null;
    this.km = Distance.ZERO.toKmInFloat();
    this.awaitingDriversResponses = 0;
  }

  public shouldNotWaitForDriverAnymore(date?: Date) {
    return (
      this.status === TransitStatus.CANCELLED ||
      dayjs(+this.getPublished())
        .add(300, 'seconds')
        .isBefore(date ?? dayjs())
    );
  }

  public changeDestinationTo(newAddress: Address, newDistance: Distance) {
    if (this.status === TransitStatus.COMPLETED) {
      throw new NotAcceptableException(
        "Address 'to' cannot be changed, id = " + this.getId(),
      );
    }

    this.to = newAddress;
    this.km = newDistance.toKmInFloat();

    this.estimateCost();
  }

  public changePickupTo(
    newAddress: Address,
    newDistance: Distance,
    distanceFromPreviousInKm: number,
  ) {
    if (distanceFromPreviousInKm > 0.25) {
      throw new NotAcceptableException(
        "Address 'to' cannot be changed, id = " + this.getId(),
      );
    }

    if (this.pickupAddressChangeCounter > 2) {
      throw new NotAcceptableException(
        "Address 'to' cannot be changed, id = " + this.getId(),
      );
    }

    if (
      this.status !== TransitStatus.DRAFT &&
      this.status !== TransitStatus.WAITING_FOR_DRIVER_ASSIGNMENT
    ) {
      throw new NotAcceptableException(
        "Address 'to' cannot be changed, id = " + this.getId(),
      );
    }

    this.from = newAddress;
    this.km = newDistance.toKmInFloat();
    this.pickupAddressChangeCounter = this.pickupAddressChangeCounter + 1;

    this.estimateCost();
  }

  public cancel() {
    if (
      ![
        TransitStatus.DRAFT,
        TransitStatus.WAITING_FOR_DRIVER_ASSIGNMENT,
        TransitStatus.TRANSIT_TO_PASSENGER,
      ].includes(this.status)
    ) {
      throw new NotAcceptableException(
        'Transit cannot be cancelled, id = ' + this.getId(),
      );
    }

    this.status = TransitStatus.CANCELLED;
    this.driver = null;
    this.km = Distance.ZERO.toKmInFloat();
    this.awaitingDriversResponses = 0;
  }

  public start(when: Date) {
    if (this.status !== TransitStatus.TRANSIT_TO_PASSENGER) {
      throw new NotAcceptableException(
        'Transit cannot be started, id = ' + this.getId(),
      );
    }

    this.status = TransitStatus.IN_TRANSIT;
    this.started = when.getTime();
  }

  public publishAt(when: Date) {
    this.status = TransitStatus.WAITING_FOR_DRIVER_ASSIGNMENT;
    this.published = when.getTime();
  }

  public setDateTime(dateTime: number) {
    this.tariff = Tariff.ofTime(new Date(dateTime));
    this.dateTime = dateTime;
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

  public getTariff() {
    return this.tariff;
  }

  public getCarType() {
    return this.carType as CarClass;
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

  public getCompleteAt() {
    return this.completeAt;
  }

  public getClient() {
    return this.client;
  }

  public getDateTime() {
    return this.dateTime;
  }

  public getPublished() {
    return this.published;
  }

  public getKm() {
    return Distance.fromKm(this.km);
  }

  public getAwaitingDriversResponses() {
    return this.awaitingDriversResponses;
  }

  public getProposedDrivers() {
    return this.proposedDrivers || [];
  }

  public getAcceptedAt() {
    return this.acceptedAt;
  }

  public getStarted() {
    return this.started;
  }

  public getFrom() {
    return this.from;
  }

  public getTo() {
    return this.to;
  }

  public getPickupAddressChangeCounter() {
    return this.pickupAddressChangeCounter;
  }

  public getDriversFee() {
    return this.driversFee;
  }

  public setDriversFee(driversFee: Money) {
    this.driversFee = driversFee;
  }

  public getEstimatedPrice() {
    return this.estimatedPrice;
  }

  private calculateCost(): Money {
    const price = this.tariff.calculateCost(this.getKm());
    this.price = price;
    return price;
  }
}
