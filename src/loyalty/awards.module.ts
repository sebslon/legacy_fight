import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppProperties } from '../config/app-properties.config';
import { ClaimModule } from '../crm/claims/claim.module';
import { ClientModule } from '../crm/client.module';
import { TransitRepository } from '../repository/transit.repository';

import { AwardedMiles } from './awarded-miles.entity';
import { AwardsAccountController } from './awards-account.controller';
import { AwardsAccount } from './awards-account.entity';
import { AwardsAccountRepository } from './awards-account.repository';
import { AwardsService } from './awards.service';

@Module({
  imports: [
    ClaimModule,
    ClientModule,
    TypeOrmModule.forFeature([
      AwardedMiles,
      AwardsAccount,
      AwardsAccountRepository,
      TransitRepository,
    ]),
  ],
  controllers: [AwardsAccountController],
  providers: [AwardsService, AppProperties],
  exports: [AwardsService],
})
export class AwardsModule {}
