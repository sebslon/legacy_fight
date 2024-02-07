export class Clock {
  public static currentDate(): Date {
    return new Date();
  }

  public static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  public static isAfter(
    date: Date | number,
    dateToCompare: Date | number,
  ): boolean {
    return date > dateToCompare;
  }

  public static isBefore(
    date: Date | number,
    dateToCompare: Date | number,
  ): boolean {
    return date < dateToCompare;
  }

  public static startOfDay(date?: Date | number): Date {
    const result = date ? new Date(date) : new Date();
    result.setHours(0, 0, 0, 0);
    return result;
  }
}
