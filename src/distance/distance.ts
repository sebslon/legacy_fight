import { NotAcceptableException } from '@nestjs/common';

export class Distance {
  private readonly MILES_TO_KILOMETERS_RATIO = 1.609344;
  private readonly km: number;

  private constructor(km: number) {
    this.km = km;
  }

  public static fromKm(km: number): Distance {
    return new Distance(km);
  }

  public toKmInFloat(): number {
    return this.km;
  }

  public toString(unit: string): string {
    if (unit === 'km') {
      if (this.km == Math.ceil(this.km)) {
        return `${Math.round(this.km).toLocaleString('US')}km`;
      }
      return `${this.km.toLocaleString('US')}km`;
    }

    if (unit === 'miles') {
      const distance = this.km / this.MILES_TO_KILOMETERS_RATIO;

      if (distance == Math.ceil(distance)) {
        return `${Math.round(distance).toLocaleString('US')}miles`;
      }

      return `${distance.toLocaleString('US')}miles`;
    }

    if (unit === 'm') {
      return `${Math.round(this.km * 1000).toLocaleString('US')}m`;
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
