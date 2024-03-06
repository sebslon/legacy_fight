import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class PartyRole {
  @PrimaryGeneratedColumn('uuid')
  private id: string;

  @Column()
  private name: string;

  public getId(): string {
    return this.id;
  }

  public setId(id: string): void {
    this.id = id;
  }

  public getName(): string {
    return this.name;
  }

  public setName(name: string): void {
    this.name = name;
  }
}
