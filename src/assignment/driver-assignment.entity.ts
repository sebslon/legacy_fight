import { NotAcceptableException } from '@nestjs/common';
import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../common/base.entity';

import { AssignmentStatus } from './assignment-status.enum';

@Entity()
export class DriverAssignment extends BaseEntity {
  @Column({ type: 'uuid' })
  private requestUUID: string;

  @Column({ nullable: true, type: 'bigint' })
  private publishedAt: number;

  @Column({ type: 'varchar' })
  private status: AssignmentStatus =
    AssignmentStatus.WAITING_FOR_DRIVER_ASSIGNMENT;

  @Column({ nullable: true, type: 'uuid' })
  private assignedDriver: string | null;

  @Column({ type: 'uuid', default: [], array: true })
  private driversRejections: string[];

  @Column({ type: 'uuid', default: [], array: true })
  private proposedDrivers: string[];

  @Column({ default: 0, type: 'integer' })
  private awaitingDriversResponses = 0;

  public static create(requestUUID: string, publishedAt: number) {
    const assignment = new DriverAssignment(requestUUID, publishedAt);

    assignment.proposedDrivers = [];
    assignment.driversRejections = [];

    return assignment;
  }

  private constructor(requestUUID: string, publishedAt: number) {
    super();
    this.requestUUID = requestUUID;
    this.publishedAt = publishedAt;
  }

  public cancel() {
    if (
      ![
        AssignmentStatus.WAITING_FOR_DRIVER_ASSIGNMENT,
        AssignmentStatus.ON_THE_WAY,
      ].includes(this.getStatus())
    ) {
      throw new Error('Transit cannot be cancelled ' + this.getId());
    }
    this.status = AssignmentStatus.CANCELLED;
    this.assignedDriver = null;
    this.awaitingDriversResponses = 0;
  }

  public canProposeTo(driverId: string) {
    return !this.getDriversRejections().includes(driverId);
  }

  public proposeTo(driverId: string) {
    if (this.canProposeTo(driverId)) {
      this.proposedDrivers.push(driverId);
      this.awaitingDriversResponses++;
    }
  }

  public failDriverAssignment() {
    this.status = AssignmentStatus.DRIVER_ASSIGNMENT_FAILED;
    this.assignedDriver = null;
    this.awaitingDriversResponses = 0;
  }

  public shouldNotWaitForDriverAnymore(date?: Date) {
    const isPastTime =
      this.publishedAt + 1000 * 60 * 5 < (date || new Date()).getTime();

    return this.getStatus() === AssignmentStatus.CANCELLED || isPastTime;
  }

  public acceptBy(driverId: string) {
    if (this.assignedDriver) {
      throw new NotAcceptableException(
        'Transit already accepted, id = ' + this.getId(),
      );
    } else {
      if (!this.getProposedDrivers().some((id) => id === driverId)) {
        throw new NotAcceptableException(
          'Driver out of possible drivers, id = ' + this.getId(),
        );
      }

      if (this.getDriversRejections().some((id) => id === driverId)) {
        throw new NotAcceptableException(
          'Driver out of possible drivers, id = ' + this.getId(),
        );
      }

      this.assignedDriver = driverId;
      this.awaitingDriversResponses = 0;
      this.status = AssignmentStatus.ON_THE_WAY;
    }

    return this;
  }

  public rejectBy(driverId: string) {
    this.driversRejections.push(driverId);
    this.awaitingDriversResponses--;
  }

  public getStatus() {
    return this.status;
  }

  public getRequestUUID() {
    return this.requestUUID;
  }

  public getAssignedDriver() {
    return this.assignedDriver;
  }

  public getAwaitingDriversResponses() {
    return this.awaitingDriversResponses;
  }

  public getProposedDrivers() {
    return this.proposedDrivers;
  }

  public getDriversRejections() {
    return this.driversRejections;
  }
}
