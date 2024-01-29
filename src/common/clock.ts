export class Clock {
  public static currentDate(): Date {
    return new Date();
  }

  public static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  public static isAfter(date: Date, dateToCompare: Date): boolean {
    return date > dateToCompare;
  }

  public static isBefore(date: Date, dateToCompare: Date): boolean {
    return date < dateToCompare;
  }
}
