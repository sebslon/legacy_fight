import { Money } from '../../../src/money/money';
import { Tariff } from '../../../src/pricing/tariff';
import { Tariffs } from '../../../src/pricing/tariffs';
import { TransitRepository } from '../../../src/ride/transit.repository';

export class StubbedTransitPrice {
  constructor(private readonly transitRepository: TransitRepository) {}

  public async stub(transitId: string, faked: Money) {
    const fakeTariff = Tariff.create(0, 'fake', faked);
    jest.spyOn(Tariffs.prototype, 'choose').mockReturnValue(fakeTariff);
  }
}
