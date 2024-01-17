import { Column, Entity, PrimaryColumn } from 'typeorm';

import { CarClass } from './car-type.entity';

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
