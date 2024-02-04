import { EntityRepository, Repository } from 'typeorm';

import { ContractAttachmentData } from '../entity/contract-attachment-data.entity';

@EntityRepository(ContractAttachmentData)
export class ContractAttachmentDataRepository extends Repository<ContractAttachmentData> {
  public async findByContractAttachmentNoIn(
    contractAttachmentNo: string[],
  ): Promise<ContractAttachmentData[]> {
    if (contractAttachmentNo.length === 0) return Promise.resolve([]);

    return this.createQueryBuilder('contractAttachmentData')
      .where(
        'contractAttachmentData.contractAttachmentNo IN (:...contractAttachmentNo)',
        {
          contractAttachmentNo,
        },
      )
      .getMany();
  }

  public async deleteByAttachmentId(attachmentId: string): Promise<void> {
    await this.query(
      `
      DELETE FROM contract_attachment_data
      WHERE "contractAttachmentNo" = (
        SELECT "contractAttachmentNo"
        FROM contract_attachment
        WHERE id = $1
      )
    `,
      [attachmentId],
    );
  }
}
