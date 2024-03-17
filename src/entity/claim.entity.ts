import { Column, Entity, ManyToOne } from 'typeorm';

import { BaseEntity } from '../common/base.entity';
import { Money } from '../money/money';

import { Client } from './client.entity';

export enum ClaimStatus {
  DRAFT = 'draft',
  NEW = 'new',
  IN_PROCESS = 'in_process',
  REFUNDED = 'refunded',
  ESCALATED = 'escalated',
  REJECTED = 'rejected',
}

export enum ClaimCompletionMode {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic',
}

@Entity()
export class Claim extends BaseEntity {
  @ManyToOne(() => Client, (client) => client.claims, { eager: true })
  public owner: Client;

  @Column({ type: 'uuid', nullable: true })
  private transitId: string;

  @Column({
    nullable: true,
    transformer: {
      to: (value: Money) => value?.toInt(),
      from: (value: number) => new Money(value),
    },
    type: 'int',
  })
  private transitPrice: Money | null;

  @Column({ type: 'bigint' })
  private creationDate: number;

  @Column({ nullable: true, type: 'bigint' })
  private completionDate: number | null;

  @Column({ nullable: true, type: 'bigint' })
  private changeDate: number | null;

  @Column()
  private reason: string;

  @Column({ nullable: true, type: 'varchar' })
  private incidentDescription: string | null;

  @Column({
    nullable: true,
    enum: ClaimCompletionMode,
    type: 'enum',
    default: null,
  })
  private completionMode: ClaimCompletionMode | null;

  @Column()
  private status: ClaimStatus;

  @Column()
  private claimNo: string;

  public escalate() {
    this.setStatus(ClaimStatus.ESCALATED);
    this.setCompletionDate(Date.now());
    this.setChangeDate(Date.now());
    this.setCompletionMode(ClaimCompletionMode.MANUAL);
  }

  public refund() {
    this.setStatus(ClaimStatus.REFUNDED);
    this.setCompletionDate(Date.now());
    this.setChangeDate(Date.now());
    this.setCompletionMode(ClaimCompletionMode.AUTOMATIC);
  }

  public getClaimNo() {
    return this.claimNo;
  }

  public setClaimNo(claimNo: string) {
    this.claimNo = claimNo;
  }

  public getOwner() {
    return this.owner;
  }

  public setOwner(owner: Client) {
    this.owner = owner;
  }

  public getTransitId() {
    return this.transitId;
  }

  public setTransit(transitId: string) {
    this.transitId = transitId;
  }

  public getTransitPrice() {
    return this.transitPrice;
  }

  public setTransitPrice(transitPrice: Money) {
    this.transitPrice = transitPrice;
  }

  public getCreationDate() {
    return this.creationDate;
  }

  public setCreationDate(creationDate: number) {
    this.creationDate = creationDate;
  }

  public getCompletionDate() {
    return this.completionDate;
  }

  public setCompletionDate(completionDate: number) {
    this.completionDate = completionDate;
  }

  public getIncidentDescription() {
    return this.incidentDescription;
  }

  public setIncidentDescription(incidentDescription: string | null) {
    this.incidentDescription = incidentDescription;
  }

  public getCompletionMode() {
    return this.completionMode;
  }

  public setCompletionMode(completionMode: ClaimCompletionMode) {
    this.completionMode = completionMode;
  }

  public getStatus() {
    return this.status;
  }

  public setStatus(status: ClaimStatus) {
    this.status = status;
  }

  public getChangeDate() {
    return this.changeDate;
  }

  public setChangeDate(changeDate: number) {
    this.changeDate = changeDate;
  }

  public getReason() {
    return this.reason;
  }

  public setReason(reason: string) {
    this.reason = reason;
  }
}
