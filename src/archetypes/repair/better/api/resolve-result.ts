import { Money } from '../../../../money/money';
import { Parts } from '../../legacy/parts/parts';

export enum ResolveResultStatus {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export class ResolveResult {
  private handlingParty: string | null;
  private totalCost: Money | null;
  private acceptedParts: Set<Parts>;
  private status: ResolveResultStatus;

  constructor(
    status: ResolveResultStatus,
    handlingParty?: string | null,
    totalCost?: Money | null,
    acceptedParts?: Set<Parts> | null,
  ) {
    this.status = status;
    this.handlingParty = handlingParty || null;
    this.totalCost = totalCost || null;
    this.acceptedParts = acceptedParts || new Set();
  }

  public getHandlingParty(): string | null {
    return this.handlingParty;
  }

  public getTotalCost(): Money | null {
    return this.totalCost;
  }

  public getAcceptedParts(): Set<Parts> {
    return this.acceptedParts;
  }

  public getStatus(): ResolveResultStatus {
    return this.status;
  }
}
