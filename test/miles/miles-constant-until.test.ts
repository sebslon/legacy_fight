import { MilesConstantUntil } from '../../src/miles/miles-constant-until';

describe('Miles Constant Until', () => {
  const YESTERDAY = new Date('2020-01-01');
  const TODAY = new Date('2020-01-02');
  const TOMORROW = new Date('2020-01-03');

  it("Miles without expiration date don't expire", () => {
    const neverExpiring = MilesConstantUntil.constantForever(10);

    expect(neverExpiring.getAmountFor(TODAY)).toEqual(10);
    expect(neverExpiring.getAmountFor(TOMORROW)).toEqual(10);
    expect(neverExpiring.getAmountFor(YESTERDAY)).toEqual(10);
  });

  it('Expiring miles expire', () => {
    const miles = MilesConstantUntil.constantUntil(10, TODAY);

    expect(miles.getAmountFor(YESTERDAY)).toEqual(10);
    expect(miles.getAmountFor(TODAY)).toEqual(10);
    expect(miles.getAmountFor(TOMORROW)).toEqual(0);
  });

  it('Can subtract when enough miles', () => {
    const expiringMiles = MilesConstantUntil.constantUntil(10, TODAY);
    const neverExpiring = MilesConstantUntil.constantForever(10);

    expect(expiringMiles.subtract(10, TODAY)).toEqual(
      MilesConstantUntil.constantUntil(0, TODAY),
    );
    expect(expiringMiles.subtract(10, YESTERDAY)).toEqual(
      MilesConstantUntil.constantUntil(0, TODAY),
    );

    expect(expiringMiles.subtract(8, TODAY)).toEqual(
      MilesConstantUntil.constantUntil(2, TODAY),
    );
    expect(expiringMiles.subtract(8, YESTERDAY)).toEqual(
      MilesConstantUntil.constantUntil(2, TODAY),
    );

    expect(neverExpiring.subtract(10, YESTERDAY)).toEqual(
      MilesConstantUntil.constantForever(0),
    );
    expect(neverExpiring.subtract(10, TODAY)).toEqual(
      MilesConstantUntil.constantForever(0),
    );
    expect(neverExpiring.subtract(10, TOMORROW)).toEqual(
      MilesConstantUntil.constantForever(0),
    );

    expect(neverExpiring.subtract(8, YESTERDAY)).toEqual(
      MilesConstantUntil.constantForever(2),
    );
    expect(neverExpiring.subtract(8, TODAY)).toEqual(
      MilesConstantUntil.constantForever(2),
    );
    expect(neverExpiring.subtract(8, TOMORROW)).toEqual(
      MilesConstantUntil.constantForever(2),
    );
  });

  it("Can't subtract when not enough miles", () => {
    const neverExpiring = MilesConstantUntil.constantForever(10);
    const expiringMiles = MilesConstantUntil.constantUntil(10, TODAY);

    expect(() => neverExpiring.subtract(11, TODAY)).toThrow(
      'Insufficient amount of miles',
    );
    expect(() => neverExpiring.subtract(11, YESTERDAY)).toThrow(
      'Insufficient amount of miles',
    );
    expect(() => neverExpiring.subtract(11, TOMORROW)).toThrow(
      'Insufficient amount of miles',
    );

    expect(() => expiringMiles.subtract(11, TODAY)).toThrow(
      'Insufficient amount of miles',
    );
    expect(() => expiringMiles.subtract(11, YESTERDAY)).toThrow(
      'Insufficient amount of miles',
    );
    expect(() => expiringMiles.subtract(11, TOMORROW)).toThrow(
      'Insufficient amount of miles',
    );

    expect(() => expiringMiles.subtract(8, TOMORROW)).toThrow(
      'Insufficient amount of miles',
    );
  });
});
