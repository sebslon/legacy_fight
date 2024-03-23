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
import { AwardsAccountController } from './controllers/awards-account.controller';
import { ClientController } from './controllers/client.controller';
import { DriverSessionController } from './controllers/driver-session.controller';
import { DriverTrackingController } from './controllers/driver-tracking.controller';
import { TransitController } from './controllers/transit.controller';
import { ClaimModule } from './crm/claims/claim.module';
import { ClaimRepository } from './crm/claims/claim.repository';
import { TransitAnalyzerModule } from './crm/transit-analyzer/transit-analyzer.module';
import { DriverAttributeRepository } from './driver-fleet/driver-attribute.repository';
import { DriverFeeRepository } from './driver-fleet/driver-fee.repository';
import { DriverFleetModule } from './driver-fleet/driver-fleet.module';
import { DriverReportModule } from './driver-fleet/driver-report/driver-report.module';
import { TravelledDistance } from './driver-fleet/driver-report/travelled-distance/travelled-distance.entity';
import { TravelledDistanceRepository } from './driver-fleet/driver-report/travelled-distance/travelled-distance.repository';
import { TravelledDistanceService } from './driver-fleet/driver-report/travelled-distance/travelled-distance.service';
import { DriverRepository } from './driver-fleet/driver.repository';
import { InvoiceModule } from './invoicing/invoice.module';
import { AwardedMiles } from './miles/awarded-miles.entity';
import { NotificationModule } from './notification/notification.module';
import { AddressRepository } from './repository/address.repository';
import { AwardsAccountRepository } from './repository/awards-account.repository';
import { ClientRepository } from './repository/client.repository';
import { DriverPositionRepository } from './repository/driver-position.repository';
import { DriverSessionRepository } from './repository/driver-session.repository';
import { TariffRepository } from './repository/tariff.repository';
import { TransitRepository } from './repository/transit.repository';
import { AwardsService } from './service/awards.service';
import { ClientService } from './service/client.service';
import { DistanceCalculator } from './service/distance-calculator.service';
import { DriverSessionService } from './service/driver-session.service';
import { DriverTrackingService } from './service/driver-tracking.service';
import { GeocodingService } from './service/geocoding.service';
import { TransitService } from './service/transit.service';
import { TransitDetailsModule } from './transit-details/transit-details.module';

@Module({
  imports: [
    DriverReportModule,
    DriverFleetModule,
    ClaimModule,
    ContractsModule,
    CarFleetModule,
    InvoiceModule,
    NotificationModule,
    TransitAnalyzerModule,
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
      TransitRepository,
      DriverRepository,
      DriverSessionRepository,
      DriverPositionRepository,
      DriverFeeRepository,
      DriverAttributeRepository,
      AddressRepository,
      AwardsAccountRepository,
      TariffRepository,
      AwardedMiles,
      TravelledDistance,
      TravelledDistanceRepository,
      ClaimRepository,
    ]),
    TransitDetailsModule,
  ],
  controllers: [
    ClientController,
    DriverSessionController,
    DriverTrackingController,
    TransitController,
    AwardsAccountController,
  ],
  providers: [
    AppProperties,
    DistanceCalculator,
    GeocodingService,
    ClientService,
    DriverSessionService,
    DriverTrackingService,
    TravelledDistanceService,
    AwardsService,
    TransitService,
    Fixtures, // TODO: For now for tests, refactor
  ],
})
export class AppModule {}
