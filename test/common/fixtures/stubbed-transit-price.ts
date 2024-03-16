import { Money } from '../../../src/money/money';
import { TransitRepository } from '../../../src/repository/transit.repository';

export class StubbedTransitPrice {
  constructor(private readonly transitRepository: TransitRepository) {}

  public async stub(transitId: string, faked: Money) {
    const transit = await this.transitRepository.findOneOrFail(transitId);

    transit.setPrice(faked);

    return await this.transitRepository.save(transit);
  }
}
