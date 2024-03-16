import { Injectable } from '@nestjs/common';

import { Transit, TransitStatus } from '../entity/transit/transit.entity';
import { TransitRepository } from '../repository/transit.repository';
import { TransitDetailsFacade } from '../transit-details/transit-details.facade';

import { GraphTransitAnalyzer } from './graph-transit-analyzer';

@Injectable()
export class PopulateGraphService {
  constructor(
    private readonly transitRepository: TransitRepository,
    private readonly graphTransitAnalyzer: GraphTransitAnalyzer,
    private readonly transitDetailsFacade: TransitDetailsFacade,
  ) {}

  public async populate() {
    await (
      await this.transitRepository.findAllByStatus(TransitStatus.COMPLETED)
    ).forEach((transit) => this.addToGraph(transit));
  }

  private async addToGraph(transit: Transit) {
    const transitDetails = await this.transitDetailsFacade.find(
      transit.getId(),
    );
    const clientId = transitDetails.client.getId();

    await this.graphTransitAnalyzer.addTransitBetweenAddresses(
      clientId,
      transit.getId(),
      transitDetails.from.getHash(),
      transitDetails.to.getHash(),
      transitDetails.started ? new Date(transitDetails.started) : new Date(),
      transitDetails.completedAt
        ? new Date(transitDetails.completedAt)
        : new Date(),
    );
  }
}
