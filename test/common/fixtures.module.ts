import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CarFleetModule } from '../../src/car-fleet/car-fleet.module';
import { ClaimModule } from '../../src/crm/claims/claim.module';
import { ClientRepository } from '../../src/crm/client.repository';
import { DriverAttributeRepository } from '../../src/driver-fleet/driver-attribute.repository';
import { DriverFeeRepository } from '../../src/driver-fleet/driver-fee.repository';
import { DriverFleetModule } from '../../src/driver-fleet/driver-fleet.module';
import { AddressRepository } from '../../src/geolocation/address/address.repository';
import { AwardsModule } from '../../src/loyalty/awards.module';
import { RideModule } from '../../src/ride/ride.module';
import { TransitDetailsModule } from '../../src/ride/transit-details/transit-details.module';
import { TransitRepository } from '../../src/ride/transit.repository';
import { DriverTrackingModule } from '../../src/tracking/driver-tracking.module';

import { Fixtures } from './fixtures';

@Module({
  imports: [
    TransitDetailsModule,
    DriverFleetModule,
    CarFleetModule,
    ClaimModule,
    AwardsModule,
    RideModule,
    DriverTrackingModule,
    TypeOrmModule.forFeature([
      DriverFeeRepository,
      TransitRepository,
      AddressRepository,
      ClientRepository,
      DriverAttributeRepository,
    ]),
  ],
  controllers: [],
  providers: [Fixtures],
  exports: [Fixtures],
})
export class FixturesModule {}
