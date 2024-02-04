import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ContractAttachmentDto } from '../dto/contract-attachment.dto';
import { ContractDTO } from '../dto/contract.dto';
import { CreateContractAttachmentDTO } from '../dto/create-contract-attachment.dto';
import { CreateContractDTO } from '../dto/create-contract.dto';
import { ContractAttachmentData } from '../entity/contract-attachment-data.entity';
import { Contract } from '../entity/contract.entity';
import { ContractAttachmentDataRepository } from '../repository/contract-attachment-data.repository';
import { ContractRepository } from '../repository/contract.repository';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(ContractRepository)
    private contractRepository: ContractRepository,
    @InjectRepository(ContractAttachmentDataRepository)
    private contractAttachmentDataRepository: ContractAttachmentDataRepository,
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

    const contractAttachmentNo =
      await this.contractRepository.findContractAttachmentNoById(attachmentId);

    contract.rejectAttachment(contractAttachmentNo);

    await this.contractRepository.save(contract);
  }

  public async acceptAttachment(attachmentId: string) {
    const contract = await this.contractRepository.findByAttachmentId(
      attachmentId,
    );

    if (!contract) {
      throw new NotFoundException('Contract does not exist');
    }

    const contractAttachmentNo =
      await this.contractRepository.findContractAttachmentNoById(attachmentId);

    contract.acceptAttachment(contractAttachmentNo);

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
    const contract = await this.find(id);
    const attachmentsData =
      await this.contractAttachmentDataRepository.findByContractAttachmentNoIn(
        contract.getAttachmentIds(),
      );

    return new ContractDTO(contract, attachmentsData);
  }

  public async proposeAttachment(
    contractId: string,
    contractAttachmentDTO: CreateContractAttachmentDTO,
  ) {
    let contract = await this.find(contractId);
    const contractAttachmentId = contract
      .proposeAttachment()
      .getContractAttachmentNo();
    const contractAttachmentData = new ContractAttachmentData(
      contractAttachmentId,
      contractAttachmentDTO.data,
    );

    contract = await this.contractRepository.save(contract);
    const attachment = contract.findAttachment(contractAttachmentId);
    const attachmentData = await this.contractAttachmentDataRepository.save(
      contractAttachmentData,
    );

    if (!attachment || !attachmentData) {
      throw new NotFoundException('Failed to propose attachment');
    }

    return new ContractAttachmentDto(attachment, attachmentData);
  }

  public async removeAttachment(contractId: string, attachmentId: string) {
    //TODO sprawdzenie czy nalezy do kontraktu (JIRA: II-14455)
    const contract = await this.find(contractId);
    const contractAttachmentNo =
      await this.contractRepository.findContractAttachmentNoById(attachmentId);

    contract.remove(contractAttachmentNo);

    await this.contractAttachmentDataRepository.deleteByAttachmentId(
      attachmentId,
    );

    await this.contractRepository.save(contract);
  }
}
