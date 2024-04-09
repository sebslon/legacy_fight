import { Injectable } from '@nestjs/common';

import { TransitDetailsDTO } from '../../ride/transit-details/transit-details.dto';
import { TransitDetailsFacade } from '../../ride/transit-details/transit-details.facade';

import { GraphTransitAnalyzer } from './graph-transit-analyzer';

@Injectable()
export class PopulateGraphService {
  constructor(
    private readonly graphTransitAnalyzer: GraphTransitAnalyzer,
    private readonly transitDetailsFacade: TransitDetailsFacade,
  ) {}

  public async populate() {
    const completed = await this.transitDetailsFacade.findCompleted();

    for (const transit of completed) {
      await this.addToGraph(transit);
    }
  }

  private async addToGraph(transitDetails: TransitDetailsDTO) {
    const clientId = transitDetails.client.getId();

    await this.graphTransitAnalyzer.addTransitBetweenAddresses(
      clientId,
      transitDetails.transitId,
      transitDetails.from.getHash(),
      transitDetails.to.getHash(),
      transitDetails.started ? new Date(transitDetails.started) : new Date(),
      transitDetails.completedAt
        ? new Date(transitDetails.completedAt)
        : new Date(),
    );
  }
}
