import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { RequestTransitService } from './request-transit.service';
import { Transit, TransitStatus } from './transit.entity';
import { TransitRepository } from './transit.repository';

@Injectable()
export class StartTransitService {
  constructor(
    @InjectRepository(TransitRepository)
    private readonly transitRepository: TransitRepository,
    private readonly requestTransitService: RequestTransitService,
  ) {}

  public async start(requestUUID: string) {
    const tariff = await this.requestTransitService.findTariff(requestUUID);

    if (!tariff) {
      throw new Error('Tariff not found for requestUUID = ' + requestUUID);
    }

    const transit = new Transit(TransitStatus.IN_TRANSIT, tariff, requestUUID);

    return await this.transitRepository.save(transit);
  }
}
