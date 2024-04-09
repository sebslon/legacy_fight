import { v4 as uuid } from 'uuid';

import { Clock } from '../../src/common/clock';
import { Distance } from '../../src/geolocation/distance';
import { Tariff } from '../../src/pricing/tariff';
import { NotPublished } from '../../src/ride/rules/not-published.rule';
import { Transit, TransitStatus } from '../../src/ride/transit.entity';

describe('Transit', () => {
  it('Can change transit destination', () => {
    const transit = createTransit();

    transit.changeDestinationTo(Distance.fromKm(20));

    expect(transit.getDistance()).toEqual(Distance.fromKm(20));
  });

  it('Cannot change destination when transit is completed', () => {
    const transit = createTransit();

    transit.completeTransitAt(Distance.fromKm(20));

    expect(() =>
      transit.changeDestinationTo(Distance.fromKm(30), new NotPublished()),
    ).toThrow();
  });

  it('Can complete transit', () => {
    const transit = createTransit();

    transit.completeTransitAt(Distance.fromKm(20));

    expect(transit.getStatus()).toEqual(TransitStatus.COMPLETED);
  });

  function createTransit() {
    return new Transit(
      TransitStatus.IN_TRANSIT,
      Tariff.ofTime(Clock.currentDate()),
      uuid(),
    );
  }
});
