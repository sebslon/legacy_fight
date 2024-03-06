import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Party } from './party';

@Entity()
export class PartyRelationship {
  constructor(
    name: string,
    roleA: string,
    roleB: string,
    partyA: Party,
    partyB: Party,
  ) {
    this.name = name;
    this.roleA = roleA;
    this.roleB = roleB;
    this.partyA = partyA;
    this.partyB = partyB;
  }

  @PrimaryGeneratedColumn('uuid')
  private id: string;

  @Column()
  private name: string;

  @Column()
  private roleA: string; //String in sake of simplicity, each domain will use own ENUM

  @Column()
  private roleB: string; //String in sake of simplicity, each domain will use own ENUM

  @ManyToOne(() => Party)
  private partyA: Party;

  @ManyToOne(() => Party)
  private partyB: Party;

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

  public getRoleA(): string {
    return this.roleA;
  }

  public setRoleA(roleA: string): void {
    this.roleA = roleA;
  }

  public getRoleB(): string {
    return this.roleB;
  }

  public setRoleB(roleB: string): void {
    this.roleB = roleB;
  }

  public getPartyA(): Party {
    return this.partyA;
  }

  public setPartyA(partyA: Party): void {
    this.partyA = partyA;
  }

  public getPartyB(): Party {
    return this.partyB;
  }

  public setPartyB(partyB: Party): void {
    this.partyB = partyB;
  }
}
