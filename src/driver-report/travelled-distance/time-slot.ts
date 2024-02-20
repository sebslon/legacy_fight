export class TimeSlot {
  private static readonly FIVE_MINUTES: number = 5 * 60 * 1000;

  private beginning: Date;
  private end: Date;

  constructor(beginning: Date, end: Date) {
    this.beginning = beginning;
    this.end = end;
  }

  public static of(beginning: Date, end: Date): TimeSlot {
    if (end <= beginning) {
      throw new Error(`From ${beginning} is after to ${end}`);
    }
    return new TimeSlot(beginning, end);
  }

  public static slotThatContains(seed: Date): TimeSlot {
    const startOfDay: Date = new Date(
      seed.getFullYear(),
      seed.getMonth(),
      seed.getDate(),
      0,
      0,
      0,
    );

    const timeFromStartOfDay: number = seed.getTime() - startOfDay.getTime();

    const intervals: number = Math.floor(
      timeFromStartOfDay / this.FIVE_MINUTES,
    );

    const from: Date = new Date(
      startOfDay.getTime() + intervals * this.FIVE_MINUTES,
    );

    return new TimeSlot(from, new Date(from.getTime() + this.FIVE_MINUTES));
  }

  public contains(timestamp: Date): boolean {
    const time = timestamp.getTime();
    const start = this.beginning.getTime();
    const end = this.end.getTime();

    return time >= start && time < end;
  }

  public endsAt(timestamp: Date): boolean {
    return this.end.getTime() === timestamp.getTime();
  }

  public isBefore(timestamp: Date): boolean {
    const time = timestamp.getTime();
    const end = this.end.getTime();

    return end < time;
  }

  public prev(): TimeSlot {
    return new TimeSlot(
      new Date(this.beginning.getTime() - TimeSlot.FIVE_MINUTES),
      new Date(this.end.getTime() - TimeSlot.FIVE_MINUTES),
    );
  }

  public getBeginning(): Date {
    return this.beginning;
  }

  public getEnd(): Date {
    return this.end;
  }
}
