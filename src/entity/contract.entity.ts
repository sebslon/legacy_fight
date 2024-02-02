import { Column, Entity, OneToMany } from 'typeorm';

import { BaseEntity } from '../common/base.entity';

import {
  ContractAttachment,
  ContractAttachmentStatus,
} from './contract-attachment.entity';

export enum ContractStatus {
  NEGOTIATIONS_IN_PROGRESS = 'negotiations_in_progress',
  REJECTED = 'rejected',
  ACCEPTED = 'accepted',
}

@Entity()
export class Contract extends BaseEntity {
  @OneToMany(
    () => ContractAttachment,
    (contractAttachment) => contractAttachment.contract,
    { eager: true, cascade: true },
  )
  public attachments: ContractAttachment[];

  public constructor(partnerName: string, subject: string, contractNo: string) {
    super();
    this.partnerName = partnerName;
    this.subject = subject;
    this.contractNo = contractNo;
  }

  @Column()
  private partnerName: string;

  @Column()
  private subject: string;

  @Column({ default: Date.now(), type: 'bigint' })
  private creationDate: number;

  @Column({ nullable: true, type: 'bigint' })
  private acceptedAt: number | null;

  @Column({ nullable: true, type: 'bigint' })
  private rejectedAt: number | null;

  @Column({ nullable: true, type: 'bigint' })
  private changeDate: number | null;

  @Column({ default: ContractStatus.NEGOTIATIONS_IN_PROGRESS })
  private status: ContractStatus;

  @Column()
  private contractNo: string;

  public getCreationDate() {
    return this.creationDate;
  }

  public getAcceptedAt() {
    return this.acceptedAt;
  }

  public getRejectedAt() {
    return this.rejectedAt;
  }

  public getChangeDate() {
    return this.changeDate;
  }

  public getStatus() {
    return this.status;
  }

  public getContractNo() {
    return this.contractNo;
  }

  public getPartnerName() {
    return this.partnerName;
  }

  public getSubject() {
    return this.subject;
  }

  public proposeAttachment(data: string) {
    const contractAttachment = new ContractAttachment();

    contractAttachment.setData(data);
    contractAttachment.setContract(this);

    this.attachments.push(contractAttachment);

    return contractAttachment;
  }

  public accept() {
    if (
      this.attachments.every(
        (a) =>
          a.getStatus() === ContractAttachmentStatus.ACCEPTED_BY_BOTH_SIDES,
      )
    ) {
      this.status = ContractStatus.ACCEPTED;
    } else {
      throw new Error('Not all attachments accepted by both sides');
    }
  }

  public reject(): void {
    this.status = ContractStatus.REJECTED;
  }

  public acceptAttachment(attachmentId: string) {
    const contractAttachment = this.findAttachment(attachmentId);

    if (
      contractAttachment?.getStatus() ===
        ContractAttachmentStatus.ACCEPTED_BY_ONE_SIDE ||
      contractAttachment?.getStatus() ===
        ContractAttachmentStatus.ACCEPTED_BY_BOTH_SIDES
    ) {
      contractAttachment.setStatus(
        ContractAttachmentStatus.ACCEPTED_BY_BOTH_SIDES,
      );
    } else {
      contractAttachment?.setStatus(
        ContractAttachmentStatus.ACCEPTED_BY_ONE_SIDE,
      );
    }
  }

  public rejectAttachment(attachmentId: string) {
    const contractAttachment = this.findAttachment(attachmentId);

    contractAttachment?.setStatus(ContractAttachmentStatus.REJECTED);
  }

  private findAttachment(attachmentId: string) {
    return this.attachments.find((a) => a.getId() === attachmentId) ?? null;
  }
}
