import { Column, Entity, PrimaryColumn } from 'typeorm';

import { CarClass } from './car-type.entity';

/**
 * @private true
 * @description CarTypeActiveCounter entity was introduced to prevent locks on car_type table when intensively updating active cars counter.
 * @important Don't use this entity directly. Use CarTypeRepository instead.
 */
@Entity()
export class CarTypeActiveCounter {
  @PrimaryColumn({ type: 'varchar', enum: CarClass })
  private carClass: CarClass;

  @Column({ type: 'int', default: 0, nullable: false })
  private activeCarsCounter: number;

  public constructor(carClass: CarClass) {
    this.carClass = carClass;
  }

  public getActiveCarsCounter() {
    return this.activeCarsCounter;
  }
}
