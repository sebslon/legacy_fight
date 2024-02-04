import { EntityRepository, Repository } from 'typeorm';

import { Contract } from '../entity/contract.entity';

@EntityRepository(Contract)
export class ContractRepository extends Repository<Contract> {
  public async findByPartnerName(partnerName: string) {
    return this.find({ where: { partnerName } });
  }

  public async findByAttachmentId(
    attachmentId: string,
  ): Promise<Contract | undefined> {
    return this.createQueryBuilder('contract')
      .innerJoinAndSelect('contract.attachments', 'attachment')
      .where('attachment.id = :id', { id: attachmentId })
      .getOne() as Promise<Contract | undefined>;
  }

  public async findContractAttachmentNoById(
    attachmentId: string,
  ): Promise<string> {
    const contractAttachmentNos = await this.query(
      `
      SELECT "contractAttachmentNo"
      FROM contract_attachment
      WHERE id = $1
    `,
      [attachmentId],
    );

    return contractAttachmentNos[0]?.contractAttachmentNo;
  }
}
