import { Column, Entity, ManyToOne } from 'typeorm';

import { BaseEntity } from '../common/base.entity';
import { Driver } from '../driver-fleet/driver.entity';

@Entity()
export class DriverPosition extends BaseEntity {
  @ManyToOne(() => Driver)
  public driver: Driver;

  @Column({ type: 'float' })
  public latitude!: number;

  @Column({ type: 'float' })
  public longitude: number;

  @Column({ type: 'bigint' })
  public seenAt: number;

  public constructor(
    driver: Driver,
    seenAt: number,
    latitude: number,
    longitude: number,
  ) {
    super();
    this.driver = driver;
    this.seenAt = seenAt;
    this.latitude = latitude;
    this.longitude = longitude;
  }

  public getDriver() {
    return this.driver;
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
