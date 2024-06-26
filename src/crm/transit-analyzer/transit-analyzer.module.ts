import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AddressRepository } from '../../geolocation/address/address.repository';
import { TransitDetailsModule } from '../../ride/transit-details/transit-details.module';

import { GraphTransitAnalyzer } from './graph-transit-analyzer';
import { PopulateGraphService } from './populate-graph.service';
import { TransitAnalyzerController } from './transit-analyzer.controller';
import { TransitCompletedListener } from './transit-completed.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([AddressRepository]),
    TransitDetailsModule,
  ],
  controllers: [TransitAnalyzerController],
  providers: [
    TransitCompletedListener,
    PopulateGraphService,
    GraphTransitAnalyzer,
  ],
  exports: [
    TransitCompletedListener,
    PopulateGraphService,
    GraphTransitAnalyzer,
  ],
})
export class TransitAnalyzerModule {}
