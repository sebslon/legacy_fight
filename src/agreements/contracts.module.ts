import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ContractAttachmentData } from './contract-attachment-data.entity';
import { ContractAttachmentDataRepository } from './contract-attachment-data.repository';
import { ContractAttachment } from './contract-attachment.entity';
import { ContractController } from './contract.controller';
import { Contract } from './contract.entity';
import { ContractRepository } from './contract.repository';
import { ContractService } from './contract.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Contract,
      ContractAttachment,
      ContractAttachmentData,
      ContractAttachmentDataRepository,
      ContractRepository,
    ]),
  ],
  controllers: [ContractController],
  providers: [ContractService],
  exports: [ContractService],
})
export class ContractsModule {}
