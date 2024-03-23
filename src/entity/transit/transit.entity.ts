import { ForbiddenException, NotAcceptableException } from '@nestjs/common';
import * as dayjs from 'dayjs';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { v4 as uuid } from 'uuid';

import { BaseEntity } from '../../common/base.entity';
import { Driver } from '../../driver-fleet/driver.entity';
import { Address } from '../../geolocation/address/address.entity';
import { Distance } from '../../geolocation/distance';
import { Money } from '../../money/money';
import { TransitDetails } from '../../transit-details/transit-details.entity';
import { PaymentType } from '../client.entity';
import { Tariff } from '../tariff.entity';

import { ChangeDestinationRule } from './rules/change-destination-rule.interface';

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
  @ManyToOne(() => Driver, {
    eager: true,
  })
  @JoinColumn()
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

  @OneToOne(() => TransitDetails, (td) => td.transit, {
    eager: true,
  })
  public transitDetails: TransitDetails;

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

  @Column({ type: 'bigint', nullable: true })
  private published: number;

  public constructor(
    status: TransitStatus = TransitStatus.DRAFT,
    when: Date,
    distance: Distance,
  ) {
    super();
    this.id = uuid();

    this.setDateTime(when?.getTime());
    this.km = distance?.toKmInFloat();
    this.status = status;
  }

  public static create(
    when: Date,
    distance: Distance,
    status: TransitStatus = TransitStatus.DRAFT,
  ) {
    const transit = new Transit(status, when, distance);

    transit.driversRejections = [];
    transit.proposedDrivers = [];
    transit.pickupAddressChangeCounter = 0;
    transit.price = null;

    return transit;
  }

  public completeTransitAt(distance: Distance) {
    if (this.status === TransitStatus.IN_TRANSIT) {
      this.km = distance.toKmInFloat();
      this.estimateCost();
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

  public acceptBy(driver: Driver) {
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
      this.status = TransitStatus.TRANSIT_TO_PASSENGER;
    }

    return this;
  }

  public canProposeTo(driver: Driver) {
    return !this.driversRejections.some((d) => d.getId() === driver.getId());
  }

  public proposeTo(driver: Driver) {
    if (this.canProposeTo(driver)) {
      const isInProposed = this.proposedDrivers.some(
        (d) => d.getId() === driver.getId(),
      );

      if (!isInProposed) {
        this.proposedDrivers.push(driver);
      }

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

  public changeDestinationTo(
    newAddress: Address,
    newDistance: Distance,
    rule: ChangeDestinationRule,
  ) {
    if (!rule.isSatisfied(this, newDistance)) {
      throw new NotAcceptableException(
        "Address 'to' cannot be changed, id = " + this.getId(),
      );
    }

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

  public start() {
    if (this.status !== TransitStatus.TRANSIT_TO_PASSENGER) {
      throw new NotAcceptableException(
        'Transit cannot be started, id = ' + this.getId(),
      );
    }

    this.status = TransitStatus.IN_TRANSIT;
  }

  public publishAt(when: Date) {
    this.status = TransitStatus.WAITING_FOR_DRIVER_ASSIGNMENT;
    this.published = when.getTime();
  }

  public setDateTime(dateTime: number) {
    this.tariff = Tariff.ofTime(new Date(dateTime));
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

  public getPickupAddressChangeCounter() {
    return this.pickupAddressChangeCounter;
  }

  public getEstimatedPrice() {
    return this.estimatedPrice;
  }

  private calculateCost(): Money {
    const price = this.tariff.calculateCost(this.getKm());
    this.price = price;
    return price;
  }

  // For testing purposes
  public static _createWithId(
    id: string,
    dateTime?: number,
    distance?: Distance,
    status?: TransitStatus,
  ) {
    const transit = new Transit(
      status ?? TransitStatus.DRAFT,
      dateTime ? new Date(dateTime) : new Date(),
      distance ?? Distance.fromKm(0),
    );

    transit.id = id;

    return transit;
  }
}
