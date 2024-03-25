import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppProperties } from '../../config/app-properties.config';
import { AwardsAccountRepository } from '../../loyalty/awards-account.repository';
import { AwardsService } from '../../loyalty/awards.service';
import { NotificationModule } from '../../notification/notification.module';
import { TransitRepository } from '../../repository/transit.repository';
import { TransitDetailsModule } from '../../transit-details/transit-details.module';
import { ClientModule } from '../client.module';
import { ClientRepository } from '../client.repository';

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
    ClientModule,
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
  ],
  exports: [ClaimService],
})
export class ClaimModule {}
