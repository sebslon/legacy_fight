import { Transit, TransitStatus } from '../transit.entity';

import { ChangeDestinationRule } from './change-destination-rule.interface';

export class NotPublished implements ChangeDestinationRule {
  public isSatisfied(transit: Transit): boolean {
    return transit.getStatus() === TransitStatus.DRAFT;
  }
}
