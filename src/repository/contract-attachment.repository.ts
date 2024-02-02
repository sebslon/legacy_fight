import { EntityRepository, Repository } from 'typeorm';

import { ContractAttachment } from '../entity/contract-attachment.entity';

@EntityRepository(ContractAttachment)
export class ContractAttachmentRepository extends Repository<ContractAttachment> {
  public async findByContractId(
    contractId: string,
  ): Promise<ContractAttachment[]> {
    return this.find({
      where: {
        contract: {
          id: contractId,
        },
      },
    });
  }
}
