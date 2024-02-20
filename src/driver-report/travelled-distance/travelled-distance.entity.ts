import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { Distance } from '../../distance/distance';
import { DriverPosition } from '../../entity/driver-position.entity';

import { TimeSlot } from './time-slot';

@Entity()
export class TravelledDistance {
  @PrimaryGeneratedColumn('uuid')
  private intervalId: string;

  @Column({ nullable: false })
  private driverId: string;

  @Column({
    nullable: false,
    type: 'jsonb',
    transformer: {
      from: (value: { beginning: string; end: string }) =>
        TimeSlot.of(new Date(value.beginning), new Date(value.end)),
      to: (value: TimeSlot) => ({
        beginning: value.getBeginning(),
        end: value.getEnd(),
      }),
    },
  })
  private timeslot: TimeSlot;

  @Column({ nullable: false, type: 'float' })
  private lastLatitude: number;

  @Column({ nullable: false, type: 'float' })
  private lastLongitude: number;

  @Column({
    nullable: false,
    type: 'float',
    transformer: {
      from: (value) => Distance.fromKm(value),
      to: (value: Distance) => value.toKmInFloat(),
    },
  })
  private distance: Distance;

  public constructor(
    driverId: string,
    timeSlot: TimeSlot,
    driverPosition: DriverPosition,
  ) {
    this.driverId = driverId;
    this.timeslot = timeSlot;
    this.lastLatitude = driverPosition?.getLatitude();
    this.lastLongitude = driverPosition?.getLongitude();
    this.distance = Distance.ZERO;
  }

  public contains(timestamp: Date): boolean {
    return this.timeslot.contains(timestamp);
  }

  public getLastLongitude(): number {
    return this.lastLongitude;
  }

  public getLastLatitude(): number {
    return this.lastLatitude;
  }

  public addDistance(
    distance: Distance,
    latitude: number,
    longitude: number,
  ): void {
    this.distance = this.distance.add(distance);
    this.lastLatitude = latitude;
    this.lastLongitude = longitude;
  }

  public endsAt(timestamp: Date): boolean {
    return this.timeslot.endsAt(timestamp);
  }

  public isBefore(timestamp: Date): boolean {
    return this.timeslot.isBefore(timestamp);
  }

  public getTimeSlot(): TimeSlot {
    return this.timeslot;
  }
}
