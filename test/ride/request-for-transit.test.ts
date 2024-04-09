import { Clock } from '../../src/common/clock';
import { Distance } from '../../src/geolocation/distance';
import { Tariff } from '../../src/pricing/tariff';
import { RequestForTransit } from '../../src/ride/request-for-transit.entity';

describe('Request For Transit', () => {
  it('Can create request for transit', () => {
    const requestForTransit = createRequestForTransit();

    expect(requestForTransit.getTariff()).not.toBeNull();
    expect(requestForTransit.getTariff().getKmRate()).not.toEqual(0);
  });

  function createRequestForTransit() {
    const tariff = Tariff.ofTime(Clock.currentDate());

    return new RequestForTransit(tariff, Distance.ZERO);
  }
});
