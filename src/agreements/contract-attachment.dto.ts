import { ContractAttachmentData } from './contract-attachment-data.entity';
import {
  ContractAttachment,
  ContractAttachmentStatus,
} from './contract-attachment.entity';

export class ContractAttachmentDto {
  private id: string;

  private contractId: string;

  private data: Buffer;

  private creationDate: Date;

  private acceptedAt: number | null;

  private rejectedAt: number | null;

  private changeDate: number | null;

  private status: ContractAttachmentStatus;

  constructor(attachment: ContractAttachment, data: ContractAttachmentData) {
    this.id = attachment.getId();
    this.data = data.getData();
    this.contractId = attachment.getContract().getId();
    this.creationDate = data.getCreationDate();
    this.rejectedAt = attachment.getRejectedAt();
    this.acceptedAt = attachment.getAcceptedAt();
    this.changeDate = attachment.getChangeDate();
    this.status = attachment.getStatus();
  }

  public getData() {
    return this.data;
  }

  public getStatus() {
    return this.status;
  }

  public getId() {
    return this.id;
  }
}
