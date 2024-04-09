import { Distance } from '../../geolocation/distance';
import { Transit, TransitStatus } from '../transit.entity';

import { ChangeDestinationRule } from './change-destination-rule.interface';

export class NoFurtherThan implements ChangeDestinationRule {
  private limit: Distance;
  private status: TransitStatus;

  constructor(status: TransitStatus, limit: Distance) {
    this.limit = limit;
    this.status = status;
  }

  public isSatisfied(transit: Transit, newDistance: Distance): boolean {
    if (transit.getStatus() !== this.status) {
      return false;
    }

    // TODO: move do method in Distance
    const kmBetween = Math.abs(
      transit.getKm().toKmInFloat() - newDistance.toKmInFloat(),
    );

    return kmBetween <= this.limit.toKmInFloat();
  }
}
