import { Distance } from '../../../distance/distance';
import { Transit } from '../transit.entity';

import { ChangeDestinationRule } from './change-destination-rule.interface';

export class OrRule implements ChangeDestinationRule {
  private rules: ChangeDestinationRule[];

  constructor(rules: ChangeDestinationRule[]) {
    this.rules = rules;
  }

  public isSatisfied(transit: Transit, newDistance: Distance) {
    return this.rules.some((rule) => rule.isSatisfied(transit, newDistance));
  }
}
