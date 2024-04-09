import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { TransitCompletedEvent } from '../../ride/events/transit-completed.event';

import { GraphTransitAnalyzer } from './graph-transit-analyzer';

@Injectable()
export class TransitCompletedListener {
  constructor(private readonly transitAnalyzer: GraphTransitAnalyzer) {}

  @OnEvent('transit.completed', { async: true })
  public async handleTransitCompletedEvent(
    payload: TransitCompletedEvent,
  ): Promise<void> {
    Logger.log('Handling transit completed event');

    await this.transitAnalyzer.addTransitBetweenAddresses(
      payload.clientId,
      payload.transitId,
      payload.addressFromHash,
      payload.addressToHash,
      payload.started,
      payload.completedAt,
    );
  }
}
