import { ForbiddenException, NotAcceptableException } from '@nestjs/common';
import { Column, Entity } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { BaseEntity } from '../common/base.entity';
import { Clock } from '../common/clock';
import { Distance } from '../geolocation/distance';
import { Money } from '../money/money';
import { Tariff } from '../pricing/tariff';

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

@Entity()
export class Transit extends BaseEntity {
  @Column()
  private status: TransitStatus;

  @Column({ type: 'uuid' })
  private requestUUID: string;

  @Column({ nullable: false, default: 0 })
  private km: number;

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

  public constructor(
    status: TransitStatus = TransitStatus.DRAFT,
    tariff: Tariff,
    transitRequestUUID: string,
  ) {
    super();

    this.status = status;
    this.tariff = tariff;
    this.requestUUID = transitRequestUUID;
  }

  public completeTransitAt(distance: Distance) {
    console.log(this);
    if (this.status === TransitStatus.IN_TRANSIT) {
      this.km = distance.toKmInFloat();
      this.status = TransitStatus.COMPLETED;
      return this.calculateFinalCosts();
    } else {
      throw new NotAcceptableException(
        'Cannot complete transit, id = ' + this.getId(),
      );
    }
  }

  public changeDestinationTo(
    newDistance: Distance,
    rule?: ChangeDestinationRule,
  ) {
    if (this.status === TransitStatus.COMPLETED) {
      throw new NotAcceptableException(
        'Cannot change destination if the transit is completed',
      );
    }

    if (rule && !rule.isSatisfied(this, newDistance)) {
      throw new NotAcceptableException(
        "Address 'to' cannot be changed, id = " + this.getId(),
      );
    }

    this.km = newDistance.toKmInFloat();
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

  public getStatus() {
    return this.status;
  }

  public getKm() {
    return Distance.fromKm(this.km);
  }

  public getDistance() {
    return Distance.fromKm(this.km);
  }

  public getRequestUUID() {
    return this.requestUUID;
  }

  private calculateCost(): Money {
    return this.tariff.calculateCost(this.getDistance());
  }

  // For testing purposes
  public static _createWithId(id: string) {
    const transit = new Transit(
      TransitStatus.DRAFT,
      Tariff.ofTime(Clock.currentDate()),
      uuid(),
    );

    transit.id = id;

    return transit;
  }
}
