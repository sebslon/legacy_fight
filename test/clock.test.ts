import { Clock } from '../src/common/clock';

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
  });

  it('Compares dates (is before)', () => {
    const date = new Date(2000, 0, 1);
    const dateToCompare = new Date(2000, 0, 2);

    expect(Clock.isBefore(dateToCompare, date)).toBe(false);
    expect(Clock.isBefore(date, dateToCompare)).toBe(true);
  });
});
