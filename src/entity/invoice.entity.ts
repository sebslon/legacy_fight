import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../common/base.entity';

@Entity()
export class Invoice extends BaseEntity {
  @Column()
  private amount: number;

  @Column()
  private subjectName: string;

  constructor(amount: number, subjectName: string) {
    super();
    this.amount = amount;
    this.subjectName = subjectName;
  }
}
