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
import { DriverController } from './controllers/driver.controller';
import { TransitController } from './controllers/transit.controller';
import { ClaimModule } from './crm/claims/claim.module';
import { ClaimRepository } from './crm/claims/claim.repository';
import { DriverReportController } from './driver-report/driver-report.controller';
import { DriverReportTokens } from './driver-report/driver-report.tokens';
import {
  DriverReportCreator,
  TestDummyReconciliation,
} from './driver-report/old/driver-report-creator';
import { OldDriverReportCreator } from './driver-report/old/old-driver-report-creator';
import { SQLBasedDriverReportCreator } from './driver-report/sql-based-driver-report-creator';
import { TravelledDistance } from './driver-report/travelled-distance/travelled-distance.entity';
import { TravelledDistanceRepository } from './driver-report/travelled-distance/travelled-distance.repository';
import { TravelledDistanceService } from './driver-report/travelled-distance/travelled-distance.service';
import { AwardedMiles } from './miles/awarded-miles.entity';
import { AddressRepository } from './repository/address.repository';
import { AwardsAccountRepository } from './repository/awards-account.repository';
import { ClientRepository } from './repository/client.repository';
import { DriverAttributeRepository } from './repository/driver-attribute.repository';
import { DriverFeeRepository } from './repository/driver-fee.repository';
import { DriverPositionRepository } from './repository/driver-position.repository';
import { DriverSessionRepository } from './repository/driver-session.repository';
import { DriverRepository } from './repository/driver.repository';
import { InvoiceRepository } from './repository/invoice.repository';
import { TariffRepository } from './repository/tariff.repository';
import { TransitRepository } from './repository/transit.repository';
import { AwardsService } from './service/awards.service';
import { ClientNotificationService } from './service/client-notification.service';
import { ClientService } from './service/client.service';
import { DistanceCalculator } from './service/distance-calculator.service';
import { DriverFeeService } from './service/driver-fee.service';
import { DriverNotificationService } from './service/driver-notification.service';
import { DriverSessionService } from './service/driver-session.service';
import { DriverTrackingService } from './service/driver-tracking.service';
import { DriverService } from './service/driver.service';
import { GeocodingService } from './service/geocoding.service';
import { InvoiceGenerator } from './service/invoice-generator.service';
import { TransitService } from './service/transit.service';
import { GraphTransitAnalyzer } from './transit-analyzer/graph-transit-analyzer';
import { TransitAnalyzerController } from './transit-analyzer/transit-analyzer.controller';
import { TransitCompletedListener } from './transit-analyzer/transit-completed.listener';
import { TransitDetailsModule } from './transit-details/transit-details.module';

@Module({
  imports: [
    ClaimModule,
    ContractsModule,
    CarFleetModule,
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
      DriverRepository,
      InvoiceRepository,
      ClientRepository,
      DriverSessionRepository,
      DriverFeeRepository,
      TransitRepository,
      DriverPositionRepository,
      AddressRepository,
      DriverAttributeRepository,
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
    DriverController,
    ClientController,
    DriverSessionController,
    DriverTrackingController,
    TransitController,
    AwardsAccountController,
    DriverReportController,
    TransitAnalyzerController,
  ],
  providers: [
    AppProperties,
    DriverService,
    DistanceCalculator,
    InvoiceGenerator,
    DriverNotificationService,
    GeocodingService,
    ClientNotificationService,
    ClientService,
    DriverSessionService,
    DriverFeeService,
    DriverTrackingService,
    AwardsService,
    TransitService,
    SQLBasedDriverReportCreator,
    OldDriverReportCreator,
    DriverReportCreator,
    GraphTransitAnalyzer,
    {
      provide: DriverReportTokens.DriverReportReconciliation,
      useClass: TestDummyReconciliation,
    },
    TravelledDistanceService,
    TransitCompletedListener,
    Fixtures, // TODO: For now for tests, refactor
  ],
})
export class AppModule {}
