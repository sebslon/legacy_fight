import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppProperties } from '../config/app-properties.config';
import { ClaimModule } from '../crm/claims/claim.module';
import { ClientRepository } from '../repository/client.repository';
import { TransitRepository } from '../repository/transit.repository';
import { ClientService } from '../service/client.service';

import { AwardedMiles } from './awarded-miles.entity';
import { AwardsAccountController } from './awards-account.controller';
import { AwardsAccount } from './awards-account.entity';
import { AwardsAccountRepository } from './awards-account.repository';
import { AwardsService } from './awards.service';

@Module({
  imports: [
    ClaimModule,
    TypeOrmModule.forFeature([
      AwardedMiles,
      AwardsAccount,
      AwardsAccountRepository,
      TransitRepository,
      ClientRepository,
    ]),
  ],
  controllers: [AwardsAccountController],
  providers: [AwardsService, AppProperties, ClientService],
  exports: [AwardsService],
})
export class AwardsModule {}
