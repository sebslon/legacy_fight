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

    if (contractNo) {
      this.attachments = this.attachments ?? [];
    }
  }

  @Column()
  private partnerName: string;

  @Column()
  private subject: string;

  @Column({ default: Date.now(), type: 'bigint' })
  private creationDate: number = Date.now();

  @Column({ nullable: true, type: 'bigint' })
  private acceptedAt: number | null;

  @Column({ nullable: true, type: 'bigint' })
  private rejectedAt: number | null;

  @Column({ nullable: true, type: 'bigint' })
  private changeDate: number | null;

  @Column({ default: ContractStatus.NEGOTIATIONS_IN_PROGRESS })
  private status: ContractStatus = ContractStatus.NEGOTIATIONS_IN_PROGRESS;

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

  public getAttachmentIds() {
    return this.attachments.map((a) => a.getContractAttachmentNo());
  }

  public proposeAttachment() {
    const contractAttachment = new ContractAttachment();

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

  public acceptAttachment(contractAttachmenNo: string) {
    const contractAttachment = this.findAttachment(contractAttachmenNo);

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

  public rejectAttachment(contractAttachmentNo: string) {
    const contractAttachment = this.findAttachment(contractAttachmentNo);

    contractAttachment?.setStatus(ContractAttachmentStatus.REJECTED);
  }

  public remove(contractAttachemntNo: string) {
    this.attachments = this.attachments.filter(
      (a) => a.getContractAttachmentNo() !== contractAttachemntNo,
    );
  }

  public findAttachment(attachmentNo: string) {
    const attachment = this.attachments.find(
      (a) => a.getContractAttachmentNo() === attachmentNo,
    );

    if (!attachment) {
      return null;
    }

    attachment.contract = this;
    return attachment;
  }
}
