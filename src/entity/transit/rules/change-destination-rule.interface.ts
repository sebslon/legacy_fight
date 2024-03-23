import { Distance } from '../../../geolocation/distance';
import { Transit } from '../transit.entity';

export interface ChangeDestinationRule {
  isSatisfied(transit: Transit, newDistance: Distance): boolean;
}
