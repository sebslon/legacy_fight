import { Money } from '../../../../../../money/money';
import { Parts } from '../../../../legacy/parts/parts';

export class RepairingResult {
  private handlingParty: string;
  private totalCost: Money;
  private handledParts: Set<Parts>;

  public constructor(
    handlingParty: string,
    totalCost: Money,
    handledParts: Set<Parts>,
  ) {
    this.handlingParty = handlingParty;
    this.totalCost = totalCost;
    this.handledParts = handledParts;
  }

  public getHandlingParty(): string {
    return this.handlingParty;
  }

  public getTotalCost(): Money {
    return this.totalCost;
  }

  public getHandledParts(): Set<Parts> {
    return this.handledParts;
  }
}
