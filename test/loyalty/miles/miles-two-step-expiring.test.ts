import { Clock } from '../../../src/common/clock';
import { MilesTwoStepExpiring } from '../../../src/loyalty/miles/miles-two-step-expiring';

describe('Miles Two Step Expiring', () => {
  const YESTERDAY = new Date('2020-01-01');
  const TODAY = new Date('2020-01-02');
  const TOMORROW = new Date('2020-01-03');

  beforeEach(() => {
    jest.spyOn(Clock, 'currentDate').mockReturnValue(TODAY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should leave half of amount after one step', () => {
    const twoStepExpiring = new MilesTwoStepExpiring(10, YESTERDAY, TODAY);

    expect(twoStepExpiring.getAmountFor(YESTERDAY)).toBe(10);
    expect(twoStepExpiring.getAmountFor(TODAY)).toBe(5);
    expect(twoStepExpiring.getAmountFor(TOMORROW)).toBe(0);
  });

  it("Can't subtract more miles than available", () => {
    const expiringInTwoStepsMiles = new MilesTwoStepExpiring(
      10,
      YESTERDAY,
      TODAY,
    );

    expect(() => expiringInTwoStepsMiles.subtract(11, YESTERDAY)).toThrow();
    expect(() => expiringInTwoStepsMiles.subtract(11, TODAY)).toThrow();
    expect(() => expiringInTwoStepsMiles.subtract(11, TOMORROW)).toThrow();
    expect(() => expiringInTwoStepsMiles.subtract(2, TOMORROW)).toThrow();
  });

  it('Can subtract when there are enough miles', () => {
    const twoStepExpiringOdd = new MilesTwoStepExpiring(9, YESTERDAY, TODAY);
    const twoStepExpiringEven = new MilesTwoStepExpiring(10, YESTERDAY, TODAY);

    expect(twoStepExpiringOdd.subtract(5, YESTERDAY)).toEqual(
      new MilesTwoStepExpiring(4, YESTERDAY, TODAY),
    );
    expect(twoStepExpiringOdd.subtract(4, TODAY)).toEqual(
      new MilesTwoStepExpiring(1, YESTERDAY, TODAY),
    );

    expect(twoStepExpiringEven.subtract(5, YESTERDAY)).toEqual(
      new MilesTwoStepExpiring(5, YESTERDAY, TODAY),
    );
    expect(twoStepExpiringEven.subtract(5, TODAY)).toEqual(
      new MilesTwoStepExpiring(0, YESTERDAY, TODAY),
    );
  });
});
