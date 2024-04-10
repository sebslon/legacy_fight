import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { TransitDemand } from './transit-demand.entity';
import { TransitDemandRepository } from './transit-demand.repository';

@Injectable()
export class DemandService {
  constructor(
    @InjectRepository(TransitDemandRepository)
    private readonly transitDemandRepository: TransitDemandRepository,
  ) {}

  public async publishDemand(requestUUID: string) {
    await this.transitDemandRepository.save(new TransitDemand(requestUUID));
  }

  public async cancelDemand(requestUUID: string) {
    const demand = await this.transitDemandRepository.findByTransitRequestUUID(
      requestUUID,
    );

    if (demand) {
      await demand.cancel();
      await this.transitDemandRepository.save(demand);
    }
  }

  public async acceptDemand(requestUUID: string) {
    const demand = await this.transitDemandRepository.findByTransitRequestUUID(
      requestUUID,
    );

    if (demand) {
      await demand.accepted();
      await this.transitDemandRepository.save(demand);
    }
  }

  public async existsFor(requestUUID: string): Promise<boolean> {
    return !!this.transitDemandRepository.findByTransitRequestUUID(requestUUID);
  }
}
