import { Column, Entity } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { BaseEntity } from '../common/base.entity';
import { Distance } from '../geolocation/distance';
import { Money } from '../money/money';
import { Tariff } from '../pricing/tariff';

@Entity()
export class RequestForTransit extends BaseEntity {
  @Column({ type: 'uuid' })
  private requestUUID = uuid();

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

  @Column({
    transformer: {
      to: (value: Distance) => value.toKmInFloat(),
      from: (value: number) => Distance.fromKm(value),
    },
    type: 'float',
  })
  private distance: Distance;

  constructor(tariff: Tariff, distance: Distance) {
    super();
    this.requestUUID = uuid();
    this.tariff = tariff;
    this.distance = distance;
  }

  public getTariff(): Tariff {
    return this.tariff;
  }

  public getDistance(): Distance {
    return this.distance;
  }

  public getEstimatedPrice() {
    return this.tariff.calculateCost(this.distance);
  }

  public getRequestUUID(): string {
    return this.requestUUID;
  }
}
