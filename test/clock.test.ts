import { Clock } from '../src/common/clock';

// TODO: add edge cases tests

describe('Clock', () => {
  it('Returns current date', () => {
    const clock = Clock.currentDate();
    const date = new Date();

    expect(clock).toBeInstanceOf(Date);
    expect(clock.getMilliseconds()).toBeCloseTo(date.getMilliseconds(), -10);
    expect(clock.getSeconds()).toBe(date.getSeconds());
    expect(clock.getMinutes()).toBe(date.getMinutes());
    expect(clock.getHours()).toBe(date.getHours());
    expect(clock.getDate()).toBe(date.getDate());
    expect(clock.getMonth()).toBe(date.getMonth());
    expect(clock.getFullYear()).toBe(date.getFullYear());
  });

  it('Adds days to date', () => {
    const date = new Date(2000, 0, 1);
    const result = Clock.addDays(date, 3);

    expect(result.getDate()).toBe(4);
    expect(result.getMonth()).toBe(0);
    expect(result.getFullYear()).toBe(2000);
  });

  it('Compares dates (is after)', () => {
    const date = new Date(2000, 0, 1);
    const dateToCompare = new Date(2000, 0, 2);

    expect(Clock.isAfter(dateToCompare, date)).toBe(true);
    expect(Clock.isAfter(date, dateToCompare)).toBe(false);

    const dateNumber = new Date(2000, 0, 1).getTime();
    const dateToCompareDate = new Date(2000, 0, 2);

    expect(Clock.isAfter(dateToCompareDate, dateNumber)).toBe(true);
    expect(Clock.isAfter(dateNumber, dateToCompareDate)).toBe(false);
  });

  it('Compares dates (is before)', () => {
    const date = new Date(2000, 0, 1);
    const dateToCompare = new Date(2000, 0, 2);

    expect(Clock.isBefore(dateToCompare, date)).toBe(false);
    expect(Clock.isBefore(date, dateToCompare)).toBe(true);

    const dateNumber = new Date(2000, 0, 1).getTime();
    const dateToCompareDate = new Date(2000, 0, 2);

    expect(Clock.isBefore(dateToCompareDate, dateNumber)).toBe(false);
    expect(Clock.isBefore(dateNumber, dateToCompareDate)).toBe(true);
  });

  it('Returns start of day', () => {
    const date = new Date(2000, 0, 1, 12, 34, 56, 789);
    const result = Clock.startOfDay(date);

    expect(result.getDate()).toBe(1);
    expect(result.getMonth()).toBe(0);
    expect(result.getFullYear()).toBe(2000);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);

    const date2 = new Date(2000, 0, 1, 12, 34, 56, 789).getTime();
    const result2 = Clock.startOfDay(date2);

    expect(result2.getDate()).toBe(1);
    expect(result2.getMonth()).toBe(0);
    expect(result2.getFullYear()).toBe(2000);
    expect(result2.getHours()).toBe(0);
    expect(result2.getMinutes()).toBe(0);
    expect(result2.getSeconds()).toBe(0);
    expect(result2.getMilliseconds()).toBe(0);
  });
});
