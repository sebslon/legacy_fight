import { TimeSlot } from '../../../src/driver-report/travelled-distance/time-slot';

describe('Slot', () => {
  const NOON = new Date('2021-01-01T12:00:00Z');
  const NOON_FIVE = new Date('2021-01-01T12:05:00Z');
  const NOON_TEN = new Date('2021-01-01T12:10:00Z');
  const ONE_MINUTE = 60 * 1000;

  it('Beginning must be before end', () => {
    expect(() => TimeSlot.of(NOON_FIVE, NOON)).toThrowError();
    expect(() => TimeSlot.of(NOON_TEN, NOON)).toThrowError();
    expect(() => TimeSlot.of(NOON_TEN, NOON_FIVE)).toThrowError();
    expect(() => TimeSlot.of(NOON_TEN, NOON_TEN)).toThrowError();
  });

  it('Can create valid slot', () => {
    const noonToFive = TimeSlot.of(NOON, NOON_FIVE);
    const fiveToTen = TimeSlot.of(NOON_FIVE, NOON_TEN);

    expect(noonToFive.getBeginning()).toEqual(NOON);
    expect(noonToFive.getEnd()).toEqual(NOON_FIVE);
    expect(fiveToTen.getBeginning()).toEqual(NOON_FIVE);
    expect(fiveToTen.getEnd()).toEqual(NOON_TEN);
  });

  it('Can create previous slot', () => {
    const noonToFive = TimeSlot.of(NOON, NOON_FIVE);
    const fiveToTen = TimeSlot.of(NOON_FIVE, NOON_TEN);
    const tenToFifteen = TimeSlot.of(
      NOON_TEN,
      new Date('2021-01-01T12:15:00Z'),
    );

    expect(fiveToTen.prev()).toEqual(noonToFive);
    expect(tenToFifteen.prev()).toEqual(fiveToTen);
    expect(tenToFifteen.prev().prev()).toEqual(noonToFive);
  });

  it('Can calculate if timestamp is within slot', () => {
    const noonToFive = TimeSlot.of(NOON, NOON_FIVE);
    const fiveToTen = TimeSlot.of(NOON_FIVE, NOON_TEN);

    expect(noonToFive.contains(NOON)).toBeTruthy();
    expect(
      noonToFive.contains(new Date(NOON.getTime() + ONE_MINUTE)),
    ).toBeTruthy();

    expect(noonToFive.contains(NOON_FIVE)).toBeFalsy();
    expect(
      noonToFive.contains(new Date(NOON_FIVE.getTime() + ONE_MINUTE)),
    ).toBeFalsy();

    expect(noonToFive.isBefore(NOON)).toBeFalsy();
    expect(noonToFive.isBefore(NOON_FIVE)).toBeFalsy();
    expect(noonToFive.isBefore(NOON_TEN)).toBeTruthy();

    expect(noonToFive.endsAt(NOON_FIVE)).toBeTruthy();

    expect(fiveToTen.contains(NOON)).toBeFalsy();
    expect(fiveToTen.contains(NOON_FIVE)).toBeTruthy();
    expect(
      fiveToTen.contains(new Date(NOON_FIVE.getTime() + ONE_MINUTE)),
    ).toBeTruthy();
    expect(fiveToTen.contains(NOON_TEN)).toBeFalsy();
    expect(
      fiveToTen.contains(new Date(NOON_TEN.getTime() + ONE_MINUTE)),
    ).toBeFalsy();

    expect(fiveToTen.isBefore(NOON)).toBeFalsy();
    expect(fiveToTen.isBefore(NOON_FIVE)).toBeFalsy();
    expect(fiveToTen.isBefore(NOON_TEN)).toBeFalsy();
    expect(
      fiveToTen.isBefore(new Date(NOON_TEN.getTime() + ONE_MINUTE)),
    ).toBeTruthy();

    expect(fiveToTen.endsAt(NOON_TEN)).toBeTruthy();
  });

  it('Can create slot from seed within that slot', () => {
    expect(TimeSlot.of(NOON, NOON_FIVE)).toEqual(
      TimeSlot.slotThatContains(new Date(NOON.getTime() + ONE_MINUTE)),
    );
    expect(TimeSlot.of(NOON, NOON_FIVE)).toEqual(
      TimeSlot.slotThatContains(new Date(NOON.getTime() + ONE_MINUTE * 2)),
    );
    expect(TimeSlot.of(NOON, NOON_FIVE)).toEqual(
      TimeSlot.slotThatContains(new Date(NOON.getTime() + ONE_MINUTE * 3)),
    );
    expect(TimeSlot.of(NOON, NOON_FIVE)).toEqual(
      TimeSlot.slotThatContains(new Date(NOON.getTime() + ONE_MINUTE * 4)),
    );

    expect(TimeSlot.of(NOON_FIVE, NOON_TEN)).toEqual(
      TimeSlot.slotThatContains(new Date(NOON_FIVE.getTime() + ONE_MINUTE)),
    );
    expect(TimeSlot.of(NOON_FIVE, NOON_TEN)).toEqual(
      TimeSlot.slotThatContains(new Date(NOON_FIVE.getTime() + ONE_MINUTE * 2)),
    );
    expect(TimeSlot.of(NOON_FIVE, NOON_TEN)).toEqual(
      TimeSlot.slotThatContains(new Date(NOON_FIVE.getTime() + ONE_MINUTE * 3)),
    );
  });
});
