import { Entity, PrimaryGeneratedColumn } from 'typeorm';
import { v4 as uuid } from 'uuid';

@Entity()
export class Party {
  constructor(id?: string) {
    this.id = id ?? uuid();
  }

  @PrimaryGeneratedColumn('uuid')
  private id: string;

  public getId(): string {
    return this.id;
  }

  public setId(id: string): void {
    this.id = id;
  }
}
