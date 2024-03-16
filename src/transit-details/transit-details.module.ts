import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TransitDetails } from './transit-details.entity';
import { TransitDetailsFacade } from './transit-details.facade';
import { TransitDetailsRepository } from './transit-details.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransitDetails, TransitDetailsRepository]),
  ],
  providers: [TransitDetailsFacade],
  exports: [TransitDetailsFacade],
})
export class TransitDetailsModule {}
