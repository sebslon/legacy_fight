import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ContractAttachmentDto } from '../dto/contract-attachment.dto';
import { ContractDTO } from '../dto/contract.dto';
import { CreateContractAttachmentDTO } from '../dto/create-contract-attachment.dto';
import { CreateContractDTO } from '../dto/create-contract.dto';
import { Contract } from '../entity/contract.entity';
import { ContractAttachmentRepository } from '../repository/contract-attachment.repository';
import { ContractRepository } from '../repository/contract.repository';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(ContractRepository)
    private contractRepository: ContractRepository,
    @InjectRepository(ContractAttachmentRepository)
    private contractAttachmentRepository: ContractAttachmentRepository,
  ) {}

  public async createContract(createContractDTO: CreateContractDTO) {
    const partnerContractsCount =
      (
        await this.contractRepository.findByPartnerName(
          createContractDTO.partnerName,
        )
      ).length + 1;

    const contract = new Contract(
      createContractDTO.partnerName,
      createContractDTO.subject,
      'C/' + partnerContractsCount + '/' + createContractDTO.partnerName,
    );

    return this.contractRepository.save(contract);
  }

  public async acceptContract(id: string) {
    const contract = await this.find(id);

    contract.accept();

    await this.contractRepository.save(contract);
  }

  public async rejectContract(id: string) {
    const contract = await this.find(id);

    contract.reject();

    await this.contractRepository.save(contract);
  }

  public async rejectAttachment(attachmentId: string) {
    const contract = await this.contractRepository.findByAttachmentId(
      attachmentId,
    );

    if (!contract) {
      throw new NotFoundException('Contract does not exist');
    }

    contract.rejectAttachment(attachmentId);

    await this.contractRepository.save(contract);
  }

  public async acceptAttachment(attachmentId: string) {
    const contract = await this.contractRepository.findByAttachmentId(
      attachmentId,
    );

    if (!contract) {
      throw new NotFoundException('Contract does not exist');
    }

    contract.acceptAttachment(attachmentId);

    await this.contractRepository.save(contract);
  }

  public async find(id: string) {
    const contract = await this.contractRepository.findOne(id);
    if (!contract) {
      throw new NotFoundException('Contract does not exist');
    }
    return contract;
  }

  public async findDto(id: string) {
    const [contract, attachments] = await Promise.all([
      this.find(id),
      this.contractAttachmentRepository.findByContractId(id),
    ]);

    return new ContractDTO(contract, attachments);
  }

  public async proposeAttachment(
    contractId: string,
    contractAttachmentDTO: CreateContractAttachmentDTO,
  ) {
    let contract = await this.find(contractId);

    contract.proposeAttachment(contractAttachmentDTO.data);

    contract = await this.contractRepository.save(contract);

    return new ContractAttachmentDto(
      contract.attachments[contract.attachments.length - 1],
    );
  }

  public async removeAttachment(contractId: string, attachmentId: string) {
    //TODO sprawdzenie czy nalezy do kontraktu (JIRA: II-14455)
    await this.contractAttachmentRepository.delete(attachmentId);
  }
}
