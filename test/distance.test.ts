import { Distance } from '../src/distance/distance';

describe('Distance', () => {
  it("Can't use invalid unit", () => {
    expect(() => Distance.fromKm(10).toString('invalid')).toThrowError(
      'Invalid unit',
    );
  });

  it('Can convert to float', () => {
    expect(Distance.fromKm(10).toKmInFloat()).toBe(10);
    expect(Distance.fromKm(10.123).toKmInFloat()).toBe(10.123);
    expect(Distance.fromKm(0).toKmInFloat()).toBe(0);
  });

  it('Can represent distance as meters', () => {
    expect(Distance.fromKm(10).toString('m')).toBe('10000m');
    expect(Distance.fromKm(10.123).toString('m')).toBe('10123m');
    expect(Distance.fromKm(0).toString('m')).toBe('0m');
    expect(Distance.fromKm(312.22).toString('m')).toBe('312220m');
  });

  it('Can represent distance as km', () => {
    expect(Distance.fromKm(10).toString('km')).toBe('10km');
    expect(Distance.fromKm(10.123).toString('km')).toBe('10.123km');
    expect(Distance.fromKm(10.05).toString('km')).toBe('10.05km');
    expect(Distance.fromKm(0).toString('km')).toBe('0km');
    expect(Distance.fromKm(2000).toString('km')).toBe('2000km');
  });

  it('Can represent distance as miles', () => {
    expect(Distance.fromKm(10).toString('miles')).toBe('6.214miles');
    expect(Distance.fromKm(96.6).toString('miles')).toBe('60.024miles');
    expect(Distance.fromKm(10.123).toString('miles')).toBe('6.29miles');
    expect(Distance.fromKm(0).toString('miles')).toBe('0miles');
  });

  it('Can add distance', () => {
    expect(Distance.fromKm(10).add(Distance.fromKm(10)).toKmInFloat()).toBe(20);
    expect(Distance.fromKm(10).add(Distance.fromKm(0)).toKmInFloat()).toBe(10);
    expect(Distance.fromKm(0).add(Distance.fromKm(10)).toKmInFloat()).toBe(10);
    expect(
      Distance.fromKm(123.5).add(Distance.fromKm(34.1)).toKmInFloat(),
    ).toBe(157.6);
  });
});
