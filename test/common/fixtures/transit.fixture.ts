import { RideService } from '../../../src/ride/ride.service';
import { TransitDetailsFacade } from '../../../src/ride/transit-details/transit-details.facade';
import { TransitRepository } from '../../../src/ride/transit.repository';

export class TransitFixture {
  constructor(
    private readonly rideService: RideService,
    private readonly transitRepository: TransitRepository,
    private readonly transitDetailsFacade: TransitDetailsFacade,
  ) {}
}
