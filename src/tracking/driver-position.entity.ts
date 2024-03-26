import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../common/base.entity';

@Entity()
export class DriverPosition extends BaseEntity {
  @Column({ type: 'uuid' })
  public driverId: string;

  @Column({ type: 'float' })
  public latitude!: number;

  @Column({ type: 'float' })
  public longitude: number;

  @Column({ type: 'bigint' })
  public seenAt: number;

  public constructor(
    driverId: string,
    seenAt: number,
    latitude: number,
    longitude: number,
  ) {
    super();
    this.driverId = driverId;
    this.seenAt = seenAt;
    this.latitude = latitude;
    this.longitude = longitude;
  }

  public getDriverId() {
    return this.driverId;
  }

  public getLatitude() {
    return this.latitude;
  }

  public getLongitude() {
    return this.longitude;
  }

  public getSeenAt() {
    return this.seenAt;
  }
}
