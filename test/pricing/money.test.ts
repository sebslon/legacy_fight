import { Money } from '../../src/money/money';

describe('Money', () => {
  it('Can create Money from integer', () => {
    expect(new Money(100).toString()).toEqual('100.00');
    expect(new Money(0).toString()).toEqual('0.00');
    expect(new Money(-100).toString()).toEqual('-100.00');

    expect(new Money(100) instanceof Money).toBeTruthy();
  });

  it('Should project money to integer', () => {
    expect(new Money(100).toInt()).toEqual(100);
    expect(new Money(0).toInt()).toEqual(0);
    expect(new Money(-100).toInt()).toEqual(-100);
  });

  it('Can add money', () => {
    expect(new Money(100).add(new Money(100))).toEqual(new Money(200));
    expect(new Money(100).add(new Money(0))).toEqual(new Money(100));
    expect(new Money(-100).add(new Money(-100))).toEqual(new Money(-200));
  });

  it('Can subtract money', () => {
    expect(new Money(100).subtract(new Money(100))).toEqual(new Money(0));
    expect(new Money(100).subtract(new Money(0))).toEqual(new Money(100));
    expect(new Money(0).subtract(new Money(100))).toEqual(new Money(-100));
    expect(new Money(-100).subtract(new Money(-100))).toEqual(new Money(0));
  });

  it('Can calculate parcentage', () => {
    expect(new Money(100).percentage(10)).toEqual(new Money(10));
    expect(new Money(100).percentage(10).toString()).toEqual('10.00');

    expect(new Money(100).percentage(0)).toEqual(new Money(0));
    expect(new Money(100).percentage(0).toString()).toEqual('0.00');

    expect(new Money(100).percentage(-10)).toEqual(new Money(-10));
    expect(new Money(100).percentage(-10).toString()).toEqual('-10.00');
  });
});
