import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppProperties } from '../../config/app-properties.config';
import { NotificationModule } from '../../notification/notification.module';
import { AwardsAccountRepository } from '../../repository/awards-account.repository';
import { ClientRepository } from '../../repository/client.repository';
import { TransitRepository } from '../../repository/transit.repository';
import { AwardsService } from '../../service/awards.service';
import { ClientService } from '../../service/client.service';
import { TransitDetailsModule } from '../../transit-details/transit-details.module';

import { ClaimAttachment } from './claim-attachment.entity';
import { ClaimAttachmentRepository } from './claim-attachment.repository';
import { ClaimNumberGenerator } from './claim-number-generator.service';
import { ClaimController } from './claim.controller';
import { Claim } from './claim.entity';
import { ClaimRepository } from './claim.repository';
import { ClaimService } from './claim.service';
import { ClaimsResolver } from './claims-resolver.entity';
import { ClaimsResolverRepository } from './claims-resolver.repository';

@Module({
  imports: [
    TransitDetailsModule,
    NotificationModule,
    TypeOrmModule.forFeature([
      ClaimAttachment,
      ClaimAttachmentRepository,
      Claim,
      ClaimRepository,
      ClaimsResolver,
      ClaimsResolverRepository,
      ClientRepository,
      TransitRepository,
      AwardsAccountRepository,
    ]),
  ],
  controllers: [ClaimController],
  providers: [
    ClaimService,
    ClaimNumberGenerator,
    // TODO: clean up after introducing more modules
    AwardsService,
    AppProperties,
    ClientService,
  ],
  exports: [ClaimService],
})
export class ClaimModule {}
