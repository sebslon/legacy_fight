import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DriverAssignmentModule } from '../assignment/driver-assignment.module';
import { ClientRepository } from '../crm/client.repository';
import { DriverFleetModule } from '../driver-fleet/driver-fleet.module';
import { DriverRepository } from '../driver-fleet/driver.repository';
import { AddressRepository } from '../geolocation/address/address.repository';
import { GeolocationModule } from '../geolocation/geolocation.module';
import { InvoiceModule } from '../invoicing/invoice.module';
import { AwardsModule } from '../loyalty/awards.module';
import { PricingModule } from '../pricing/pricing.module';

import { ChangeDestinationService } from './change-destination.service';
import { ChangePickupService } from './change-pickup.service';
import { CompleteTransitService } from './complete-transit.service';
import { DemandService } from './demand.service';
import { RequestForTransit } from './request-for-transit.entity';
import { RequestForTransitRepository } from './request-for-transit.repository';
import { RequestTransitService } from './request-transit.service';
import { RideService } from './ride.service';
import { StartTransitService } from './start-transit.service';
import { TransitDemand } from './transit-demand.entity';
import { TransitDemandRepository } from './transit-demand.repository';
import { TransitDetailsModule } from './transit-details/transit-details.module';
import { TransitController } from './transit.controller';
import { Transit } from './transit.entity';
import { TransitRepository } from './transit.repository';

@Module({
  imports: [
    TransitDetailsModule,
    AwardsModule,
    DriverFleetModule,
    GeolocationModule,
    InvoiceModule,
    PricingModule,
    DriverAssignmentModule,
    TypeOrmModule.forFeature([
      RequestForTransit,
      RequestForTransitRepository,
      TransitDemand,
      TransitDemandRepository,
      Transit,
      TransitRepository,
      ClientRepository,
      DriverRepository,
      AddressRepository,
    ]),
  ],
  controllers: [TransitController],
  providers: [
    RideService,
    RequestTransitService,
    ChangePickupService,
    ChangeDestinationService,
    CompleteTransitService,
    DemandService,
    StartTransitService,
  ],
  exports: [TransitDetailsModule, RideService],
})
export class RideModule {}
