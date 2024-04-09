import { TransitDetailsFacade } from '../../../src/ride/transit-details/transit-details.facade';
import { TransitRepository } from '../../../src/ride/transit.repository';
import { TransitService } from '../../../src/ride/transit.service';

export class TransitFixture {
  constructor(
    private readonly transitService: TransitService,
    private readonly transitRepository: TransitRepository,
    private readonly transitDetailsFacade: TransitDetailsFacade,
  ) {}
}
