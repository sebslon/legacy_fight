import { TransitRepository } from '../../../src/repository/transit.repository';
import { TransitService } from '../../../src/service/transit.service';
import { TransitDetailsFacade } from '../../../src/transit-details/transit-details.facade';

export class TransitFixture {
  constructor(
    private readonly transitService: TransitService,
    private readonly transitRepository: TransitRepository,
    private readonly transitDetailsFacade: TransitDetailsFacade,
  ) {}
}
