import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

import { AppProperties } from './config/app-properties.config';
import typeormConfig from './config/typeorm.config';
import { AwardsAccountController } from './controllers/awards-account.controller';
import { CarTypeController } from './controllers/car-type.controller';
import { ClaimController } from './controllers/claim.controller';
import { ClientController } from './controllers/client.controller';
import { ContractController } from './controllers/contract.controller';
import { DriverReportController } from './controllers/driver-report.controller';
import { DriverSessionController } from './controllers/driver-session.controller';
import { DriverTrackingController } from './controllers/driver-tracking.controller';
import { DriverController } from './controllers/driver.controller';
import { TransitAnalyzerController } from './controllers/transit-analyzer.controller';
import { TransitController } from './controllers/transit.controller';
import { AddressRepository } from './repository/address.repository';
import { AwardedMilesRepository } from './repository/awarded-miles.repository';
import { AwardsAccountRepository } from './repository/awards-account.repository';
import { CarTypeRepository } from './repository/car-type.repository';
import { ClaimAttachmentRepository } from './repository/claim-attachment.repository';
import { ClaimRepository } from './repository/claim.repository';
import { ClientRepository } from './repository/client.repository';
import { ContractAttachmentRepository } from './repository/contract-attachment.repository';
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
import { TransitAnalyzerService } from './service/transit-analyzer.service';
import { TransitService } from './service/transit.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(typeormConfig() as TypeOrmModuleOptions),
    TypeOrmModule.forFeature([
      DriverRepository,
      CarTypeRepository,
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
      AwardedMilesRepository,
      AwardsAccountRepository,
      ContractAttachmentRepository,
      ContractRepository,
      TariffRepository,
    ]),
  ],
  controllers: [
    DriverController,
    CarTypeController,
    ClientController,
    DriverSessionController,
    DriverTrackingController,
    TransitAnalyzerController,
    TransitController,
    AwardsAccountController,
    ClaimController,
    ContractController,
    DriverReportController,
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
    TransitAnalyzerService,
    AwardsService,
    ClaimService,
    ContractService,
    TransitService,
  ],
})
export class AppModule {}
