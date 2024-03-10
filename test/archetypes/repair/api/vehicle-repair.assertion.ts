import {
  ResolveResult,
  ResolveResultStatus,
} from '../../../../src/archetypes/repair/better/api/resolve-result';
import { PartyId } from '../../../../src/archetypes/repair/better/party/api/party-id';
import { Parts } from '../../../../src/archetypes/repair/legacy/parts/parts';
import { Money } from '../../../../src/money/money';

export class VehicleRepairAssertion {
  private result: ResolveResult;

  public constructor(result: ResolveResult, demandSuccess?: boolean) {
    this.result = result;

    if (demandSuccess) {
      expect(result.getStatus()).toBe(ResolveResultStatus.SUCCESS);
    } else {
      expect(result.getStatus()).toBe(ResolveResultStatus.ERROR);
    }
  }

  public free() {
    expect(this.result.getTotalCost()).toEqual(Money.ZERO);
    return this;
  }

  public allParts() {
    expect(this.result.getAcceptedParts()).toEqual(Parts);
    return this;
  }

  public by(handlingParty: PartyId) {
    expect(this.result.getHandlingParty()).toEqual(handlingParty.toUUID());
    return this;
  }

  public allPartsBut(parts: Set<Parts>, excluded: Set<Parts>) {
    const acceptedParts = this.result.getAcceptedParts();
    expect(acceptedParts).toContain(parts);
    expect(acceptedParts).not.toContain(excluded);
    return this;
  }
}
