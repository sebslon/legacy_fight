import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../common/base.entity';

@Entity()
export class ContractAttachmentData extends BaseEntity {
  @Column({
    type: 'uuid',
  })
  private contractAttachmentNo: string;

  @Column({
    type: 'bytea',
  })
  private data: Buffer;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  private creationDate: Date;

  public constructor(contractAttachmentNo: string, data: string) {
    super();
    this.contractAttachmentNo = contractAttachmentNo;
    this.data = data
      ? Buffer.from(
          '\\x' + Buffer.from(data.toString(), 'base64').toString('hex'),
        )
      : Buffer.from('');
  }

  public getData() {
    return this.data;
  }

  public getContractAttachmentNo() {
    return this.contractAttachmentNo;
  }

  public getCreationDate() {
    return this.creationDate;
  }
}
