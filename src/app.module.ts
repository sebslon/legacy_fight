import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

import { FixturesModule } from '../test/common/fixtures.module';

import { ContractsModule } from './agreements/contracts.module';
import { CarFleetModule } from './car-fleet/car-fleet.module';
import { AppProperties } from './config/app-properties.config';
import { Neo4jModule } from './config/neo4j/neo4j.module';
import typeormConfig from './config/typeorm.config';
import { ClaimModule } from './crm/claims/claim.module';
import { ClaimRepository } from './crm/claims/claim.repository';
import { ClientModule } from './crm/client.module';
import { TransitAnalyzerModule } from './crm/transit-analyzer/transit-analyzer.module';
import { DriverFleetModule } from './driver-fleet/driver-fleet.module';
import { DriverReportModule } from './driver-fleet/driver-report/driver-report.module';
import { GeolocationModule } from './geolocation/geolocation.module';
import { InvoiceModule } from './invoicing/invoice.module';
import { AwardsModule } from './loyalty/awards.module';
import { NotificationModule } from './notification/notification.module';
import { RideModule } from './ride/ride.module';
import { TransitDetailsModule } from './ride/transit-details/transit-details.module';
import { TransitRepository } from './ride/transit.repository';
import { DriverTrackingModule } from './tracking/driver-tracking.module';

@Module({
  imports: [
    AwardsModule,
    DriverReportModule,
    DriverFleetModule,
    ClaimModule,
    ContractsModule,
    CarFleetModule,
    InvoiceModule,
    NotificationModule,
    TransitAnalyzerModule,
    GeolocationModule,
    ClientModule,
    DriverTrackingModule,
    RideModule,
    TransitDetailsModule,
    FixturesModule,
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(typeormConfig() as TypeOrmModuleOptions),
    Neo4jModule.forRoot({
      scheme: 'neo4j',
      host: process.env.NEO4J_HOST || 'localhost',
      port: process.env.NEO4j_PORT || 37687,
      username: process.env.NEO4J_USER || 'neo4j',
      password: process.env.NEO4j_PASSWORD || 'test_password',
      database: 'neo4j',
      global: true,
    }),
    TypeOrmModule.forFeature([ClaimRepository, TransitRepository]),
  ],
  controllers: [],
  providers: [AppProperties],
})
export class AppModule {}
