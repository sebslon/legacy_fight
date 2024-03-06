import { Money } from '../../../../../../money/money';
import { Parts } from '../../../../legacy/parts/parts';
import { RepairRequest } from '../../../api/repair-request';
import { Party } from '../../../party/model/party/party';

import { RepairingResult } from './repairing-results';
import { RoleForRepairer } from './role-for-repairer';

export class ExtendedInsurance extends RoleForRepairer {
  public constructor(party: Party) {
    super(party);
  }

  public handle(repairRequest: RepairRequest) {
    const handledParts: Set<Parts> = new Set(
      [...repairRequest.getPartsToRepair()].filter((p) => p !== Parts.PAINT),
    );

    return new RepairingResult(this.party.getId(), Money.ZERO, handledParts);
  }
}
