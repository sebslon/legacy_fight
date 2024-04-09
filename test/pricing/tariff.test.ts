import { Distance } from '../../src/geolocation/distance';
import { Money } from '../../src/money/money';
import { Tariff } from '../../src/pricing/tariff';

describe('Tariff', () => {
  it('(Standard) Regular Tariff should be displayed and calculated', () => {
    const tariff = Tariff.ofTime(new Date('2023-01-03T12:00:00'));

    expect(tariff.calculateCost(Distance.fromKm(20))).toEqual(new Money(2900));
    expect(tariff.getName()).toEqual('Standard');
    expect(tariff.getKmRate()).toEqual(1.0);
  });

  it('(Weekend) Sunday Tariff should be displayed and calculated', () => {
    const tariff = Tariff.ofTime(new Date('2023-01-01T12:00:00'));

    expect(tariff.calculateCost(Distance.fromKm(20))).toEqual(new Money(3800));
    expect(tariff.getName()).toEqual('Weekend');
    expect(tariff.getKmRate()).toEqual(1.5);
  });

  it('(Sylwester) New Years Eve Tariff should be displayed and calculated', () => {
    const tariff = Tariff.ofTime(new Date('2023-12-31T12:00:00'));

    expect(tariff.calculateCost(Distance.fromKm(20))).toEqual(new Money(8100));
    expect(tariff.getName()).toEqual('Sylwester');
    expect(tariff.getKmRate()).toEqual(3.5);
  });

  it('(Weekend) Saturday Tariff should be displayed and calculated', () => {
    const tariff = Tariff.ofTime(new Date('2023-01-07T12:00:00'));

    expect(tariff.calculateCost(Distance.fromKm(20))).toEqual(new Money(3800));
    expect(tariff.getName()).toEqual('Weekend');
    expect(tariff.getKmRate()).toEqual(1.5);
  });

  it('(Weekend+) Saturday Night Tariff should be displayed and calculated', () => {
    const tariff = Tariff.ofTime(new Date('2023-01-07T23:00:00'));

    expect(tariff.calculateCost(Distance.fromKm(20))).toEqual(new Money(6000));
    expect(tariff.getName()).toEqual('Weekend+');
    expect(tariff.getKmRate()).toEqual(2.5);
  });
});
