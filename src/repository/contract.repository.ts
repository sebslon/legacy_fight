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
      .getOne();
  }
}
