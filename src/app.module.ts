import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

import { Fixtures } from '../test/common/fixtures';

import { ContractsModule } from './agreements/contracts.module';
import { CarFleetModule } from './car-fleet/car-fleet.module';
import { AppProperties } from './config/app-properties.config';
import { Neo4jModule } from './config/neo4j/neo4j.module';
import typeormConfig from './config/typeorm.config';
import { ClaimModule } from './crm/claims/claim.module';
import { ClaimRepository } from './crm/claims/claim.repository';
import { ClientModule } from './crm/client.module';
import { ClientRepository } from './crm/client.repository';
import { TransitAnalyzerModule } from './crm/transit-analyzer/transit-analyzer.module';
import { DriverAttributeRepository } from './driver-fleet/driver-attribute.repository';
import { DriverFeeRepository } from './driver-fleet/driver-fee.repository';
import { DriverFleetModule } from './driver-fleet/driver-fleet.module';
import { DriverReportModule } from './driver-fleet/driver-report/driver-report.module';
import { TravelledDistance } from './driver-fleet/driver-report/travelled-distance/travelled-distance.entity';
import { TravelledDistanceRepository } from './driver-fleet/driver-report/travelled-distance/travelled-distance.repository';
import { TravelledDistanceService } from './driver-fleet/driver-report/travelled-distance/travelled-distance.service';
import { DriverRepository } from './driver-fleet/driver.repository';
import { AddressRepository } from './geolocation/address/address.repository';
import { GeolocationModule } from './geolocation/geolocation.module';
import { InvoiceModule } from './invoicing/invoice.module';
import { AwardedMiles } from './loyalty/awarded-miles.entity';
import { AwardsModule } from './loyalty/awards.module';
import { NotificationModule } from './notification/notification.module';
import { RideModule } from './ride/ride.module';
import { TransitDetailsModule } from './ride/transit-details/transit-details.module';
import { TransitRepository } from './ride/transit.repository';
import { DriverPositionRepository } from './tracking/driver-position.repository';
import { DriverSessionRepository } from './tracking/driver-session.repository';
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
    TypeOrmModule.forFeature([
      ClientRepository,
      DriverRepository,
      DriverFeeRepository,
      DriverPositionRepository,
      DriverSessionRepository,
      DriverAttributeRepository,
      AddressRepository,
      AwardedMiles,
      TravelledDistance,
      TravelledDistanceRepository,
      ClaimRepository,
      TransitRepository,
    ]),
    TransitDetailsModule,
  ],
  controllers: [],
  providers: [
    AppProperties,
    TravelledDistanceService,
    Fixtures, // TODO: For now for tests, refactor
  ],
})
export class AppModule {}
