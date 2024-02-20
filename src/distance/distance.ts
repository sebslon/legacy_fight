import { NotAcceptableException } from '@nestjs/common';

export class Distance {
  private readonly MILES_TO_KILOMETERS_RATIO = 1.609344;
  private readonly km: number;

  public static readonly ZERO = new Distance(0);

  private constructor(km: number) {
    this.km = km;
  }

  public static fromKm(km: number): Distance {
    return new Distance(km);
  }

  public toKmInFloat(): number {
    return this.km;
  }

  public add(distance: Distance): Distance {
    return new Distance(this.km + distance.km);
  }

  public toString(unit: string): string {
    if (unit === 'km') {
      return `${parseFloat(this.km.toFixed(3)).toString()}km`;
    }

    if (unit === 'miles') {
      const distance = this.km / this.MILES_TO_KILOMETERS_RATIO;

      if (distance == Math.ceil(distance)) {
        return `${parseFloat(distance.toFixed(3)).toString()}miles`;
      }

      return `${parseFloat(distance.toFixed(3)).toString()}miles`;
    }

    if (unit === 'm') {
      return `${(this.km * 1000).toFixed(0)}m`;
    }

    throw new NotAcceptableException('Invalid unit ' + unit);
  }

  public equals(distance: object): boolean {
    if (!distance || !(distance instanceof Distance)) {
      return false;
    }

    return this.toKmInFloat() === distance.toKmInFloat();
  }
}
