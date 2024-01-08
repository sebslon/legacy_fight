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
    expect(Distance.fromKm(10).toString('m')).toBe('10,000m');
    expect(Distance.fromKm(10.123).toString('m')).toBe('10,123m');
    expect(Distance.fromKm(0).toString('m')).toBe('0m');
  });

  it('Can represent distance as km', () => {
    expect(Distance.fromKm(10).toString('km')).toBe('10km');
    expect(Distance.fromKm(10.123).toString('km')).toBe('10.123km');
    expect(Distance.fromKm(0).toString('km')).toBe('0km');
  });

  it('Can represent distance as miles', () => {
    expect(Distance.fromKm(10).toString('miles')).toBe('6.214miles');
    expect(Distance.fromKm(10.123).toString('miles')).toBe('6.29miles');
    expect(Distance.fromKm(0).toString('miles')).toBe('0miles');
  });
});
