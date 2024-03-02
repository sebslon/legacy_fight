import { Money } from '../../../../money/money';
import { Parts } from '../parts/parts';

import { CommonBaseAbstractJob } from './common-base-abstract-job';

export class RepairJob extends CommonBaseAbstractJob {
  private partsToRepair: Set<Parts>;
  private estimatedValue: Money;

  public getEstimatedValue(): Money {
    return this.estimatedValue;
  }

  public setEstimatedValue(value: Money) {
    this.estimatedValue = value;
  }

  public getPartsToRepair(): Set<Parts> {
    return this.partsToRepair;
  }

  public setPartsToRepair(parts: Set<Parts>) {
    this.partsToRepair = parts;
  }
}
