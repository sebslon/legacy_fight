import { Distance } from '../../src/geolocation/distance';
import { Money } from '../../src/money/money';
import { Tariff } from '../../src/pricing/tariff';
import { RequestForTransit } from '../../src/ride/request-for-transit.entity';

describe('Calculate Transit Price', () => {
  it('Calculates price on regular day', () => {
    const expectedPrice = 2900;

    const requestForTransit = transitWasOnDoneOnFriday(Distance.fromKm(20));

    const price = requestForTransit.getEstimatedPrice();

    expect(price).toEqual(new Money(expectedPrice));
  });

  it('Calculates price on sunday', () => {
    const requesForTransit = transitWasOnDoneOnSunday(Distance.fromKm(20));

    const price = requesForTransit.getEstimatedPrice();

    expect(price).toEqual(new Money(3800));
  });

  it('Calculates price on new years eve', () => {
    const requestForTransit = transitWasOnDoneOnNewYearsEve(
      Distance.fromKm(20),
    );

    const price = requestForTransit.getEstimatedPrice();

    expect(price).toEqual(new Money(8100));
  });

  it('Calculates price on saturday', () => {
    const requestForTransit = transitWasOnDoneOnSaturday(Distance.fromKm(20));

    const price = requestForTransit.getEstimatedPrice();

    expect(price).toEqual(new Money(3800));
  });

  it('Calculates price on saturday night', () => {
    const requestForTransit = transitWasOnDoneOnSaturdayNight(
      Distance.fromKm(20),
    );

    const price = requestForTransit.getEstimatedPrice();

    expect(price).toEqual(new Money(6000));
  });

  // HELPER FUNCTIONS

  function transitWasOnDoneOnFriday(distance: Distance) {
    const tariff = Tariff.ofTime(new Date('2023-01-06T12:00:00'));
    const requestForTransit = new RequestForTransit(tariff, distance);

    return requestForTransit;
  }

  function transitWasOnDoneOnSunday(distance: Distance) {
    const tariff = Tariff.ofTime(new Date('2023-01-08T12:00:00'));
    const requestForTransit = new RequestForTransit(tariff, distance);

    return requestForTransit;
  }

  function transitWasOnDoneOnSaturday(distance: Distance) {
    const tariff = Tariff.ofTime(new Date('2023-01-07T12:00:00'));
    const requestForTransit = new RequestForTransit(tariff, distance);

    return requestForTransit;
  }

  function transitWasOnDoneOnSaturdayNight(distance: Distance) {
    const tariff = Tariff.ofTime(new Date('2023-01-07T23:00:00'));
    const requestForTransit = new RequestForTransit(tariff, distance);

    return requestForTransit;
  }

  function transitWasOnDoneOnNewYearsEve(distance: Distance) {
    const tariff = Tariff.ofTime(new Date('2023-12-31T12:00:00'));
    const requestForTransit = new RequestForTransit(tariff, distance);

    return requestForTransit;
  }
});
