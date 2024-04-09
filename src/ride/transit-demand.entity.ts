import { NotAcceptableException } from '@nestjs/common';
import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../common/base.entity';

import { TransitStatus } from './transit.entity';

@Entity()
export class TransitDemand extends BaseEntity {
  @Column({ type: 'uuid' })
  private requestUUID: string;

  @Column()
  private status:
    | TransitStatus.CANCELLED
    | TransitStatus.WAITING_FOR_DRIVER_ASSIGNMENT
    | TransitStatus.TRANSIT_TO_PASSENGER;

  @Column({ default: 0, type: 'int' })
  private pickupAddressChangeCounter = 0;

  constructor(transitRequestUUID: string) {
    super();
    this.requestUUID = transitRequestUUID;
    this.status = TransitStatus.WAITING_FOR_DRIVER_ASSIGNMENT;
  }

  public changePickup(distanceFromPreviousPickup: number) {
    if (distanceFromPreviousPickup > 0.25) {
      throw new NotAcceptableException(
        "Address 'from' cannot be changed, id = " + this.getId(),
      );
    }

    if (this.pickupAddressChangeCounter > 2) {
      throw new NotAcceptableException(
        "Address 'from' cannot be changed, id = " + this.getId(),
      );
    }

    if (this.status !== TransitStatus.WAITING_FOR_DRIVER_ASSIGNMENT) {
      throw new NotAcceptableException(
        "Address 'from' cannot be changed, id = " + this.getId(),
      );
    }

    this.pickupAddressChangeCounter = this.pickupAddressChangeCounter + 1;
  }

  public accepted() {
    this.status = TransitStatus.TRANSIT_TO_PASSENGER;
  }

  public cancel() {
    if (this.status !== TransitStatus.WAITING_FOR_DRIVER_ASSIGNMENT) {
      throw new NotAcceptableException(
        'Demand cannot be cancelled, id = ' + this.getId(),
      );
    }

    this.status = TransitStatus.CANCELLED;
  }

  public getStatus() {
    return this.status;
  }
}
