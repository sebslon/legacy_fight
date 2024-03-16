import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

import { Fixtures } from '../test/common/fixtures';

import { AppProperties } from './config/app-properties.config';
import { Neo4jModule } from './config/neo4j/neo4j.module';
import typeormConfig from './config/typeorm.config';
import { AwardsAccountController } from './controllers/awards-account.controller';
import { CarTypeController } from './controllers/car-type.controller';
import { ClaimController } from './controllers/claim.controller';
import { ClientController } from './controllers/client.controller';
import { ContractController } from './controllers/contract.controller';
import { DriverSessionController } from './controllers/driver-session.controller';
import { DriverTrackingController } from './controllers/driver-tracking.controller';
import { DriverController } from './controllers/driver.controller';
import { TransitController } from './controllers/transit.controller';
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
import { ContractAttachment } from './entity/contract-attachment.entity';
import { AwardedMiles } from './miles/awarded-miles.entity';
import { AddressRepository } from './repository/address.repository';
import { AwardsAccountRepository } from './repository/awards-account.repository';
import {
  CarTypeActiveCounterRepository,
  CarTypeEntityRepository,
  CarTypeRepository,
} from './repository/car-type.repository';
import { ClaimAttachmentRepository } from './repository/claim-attachment.repository';
import { ClaimRepository } from './repository/claim.repository';
import { ClaimsResolverRepository } from './repository/claims-resolver.repository';
import { ClientRepository } from './repository/client.repository';
import { ContractAttachmentDataRepository } from './repository/contract-attachment-data.repository';
import { ContractRepository } from './repository/contract.repository';
import { DriverAttributeRepository } from './repository/driver-attribute.repository';
import { DriverFeeRepository } from './repository/driver-fee.repository';
import { DriverPositionRepository } from './repository/driver-position.repository';
import { DriverSessionRepository } from './repository/driver-session.repository';
import { DriverRepository } from './repository/driver.repository';
import { InvoiceRepository } from './repository/invoice.repository';
import { TariffRepository } from './repository/tariff.repository';
import { TransitRepository } from './repository/transit.repository';
import { AwardsService } from './service/awards.service';
import { CarTypeService } from './service/car-type.service';
import { ClaimNumberGenerator } from './service/claim-number-generator.service';
import { ClaimService } from './service/claim.service';
import { ClientNotificationService } from './service/client-notification.service';
import { ClientService } from './service/client.service';
import { ContractService } from './service/contract.service';
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
      ClaimRepository,
      ClientRepository,
      DriverSessionRepository,
      DriverFeeRepository,
      TransitRepository,
      DriverPositionRepository,
      ClaimAttachmentRepository,
      AddressRepository,
      DriverAttributeRepository,
      AwardsAccountRepository,
      ContractAttachmentDataRepository,
      ContractRepository,
      TariffRepository,
      CarTypeEntityRepository,
      CarTypeActiveCounterRepository,
      ClaimsResolverRepository,
      AwardedMiles,
      ContractAttachment,
      TravelledDistance,
      TravelledDistanceRepository,
    ]),
    TransitDetailsModule,
  ],
  controllers: [
    DriverController,
    CarTypeController,
    ClientController,
    DriverSessionController,
    DriverTrackingController,
    TransitController,
    AwardsAccountController,
    ClaimController,
    ContractController,
    DriverReportController,
    TransitAnalyzerController,
  ],
  providers: [
    AppProperties,
    DriverService,
    CarTypeService,
    DistanceCalculator,
    InvoiceGenerator,
    DriverNotificationService,
    GeocodingService,
    ClaimNumberGenerator,
    ClientNotificationService,
    ClientService,
    DriverSessionService,
    DriverFeeService,
    DriverTrackingService,
    AwardsService,
    ClaimService,
    ContractService,
    TransitService,
    CarTypeRepository,
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
