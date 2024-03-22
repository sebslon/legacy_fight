import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { BaseEntity } from '../common/base.entity';

import { Contract } from './contract.entity';

export enum ContractAttachmentStatus {
  PROPOSED = 'proposed',
  ACCEPTED_BY_ONE_SIDE = 'accepted_by_one_side',
  ACCEPTED_BY_BOTH_SIDES = 'accepted_by_both_side',
  REJECTED = 'rejected',
}

@Entity()
export class ContractAttachment extends BaseEntity {
  @ManyToOne(() => Contract, (contract) => contract.attachments)
  @JoinColumn()
  public contract: Contract;

  @Column({ type: 'uuid', nullable: false })
  private contractAttachmentNo: string = uuid();

  @Column({ nullable: true, type: 'bigint' })
  private acceptedAt: number | null;

  @Column({ nullable: true, type: 'bigint' })
  private rejectedAt: number | null;

  @Column({ nullable: true, type: 'bigint' })
  private changeDate: number;

  @Column({ default: ContractAttachmentStatus.PROPOSED })
  private status: ContractAttachmentStatus = ContractAttachmentStatus.PROPOSED;

  public getAcceptedAt() {
    return this.acceptedAt;
  }

  public setAcceptedAt(acceptedAt: number) {
    this.acceptedAt = acceptedAt;
  }

  public getRejectedAt() {
    return this.rejectedAt;
  }

  public setRejectedAt(rejectedAt: number) {
    this.rejectedAt = rejectedAt;
  }

  public getChangeDate() {
    return this.changeDate;
  }

  public setChangeDate(changeDate: number) {
    this.changeDate = changeDate;
  }

  public getStatus() {
    return this.status;
  }

  public setStatus(status: ContractAttachmentStatus) {
    this.status = status;
  }

  public getContract() {
    return this.contract;
  }

  public setContract(contract: Contract) {
    this.contract = contract;
  }

  public getContractAttachmentNo() {
    return this.contractAttachmentNo;
  }
}
