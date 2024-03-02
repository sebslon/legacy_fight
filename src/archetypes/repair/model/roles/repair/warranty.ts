import { Money } from '../../../../../money/money';
import { Party } from '../../../../party/model/party/party';
import { RepairRequest } from '../../../api/repair-request';
import { Parts } from '../../../legacy/parts/parts';

import { RepairingResult } from './repairing-results';
import { RoleForRepairer } from './role-for-repairer';

export class Warranty extends RoleForRepairer {
  public constructor(party: Party) {
    super(party);
  }

  public handle(repairRequest: RepairRequest) {
    const handledParts: Set<Parts> = new Set(repairRequest.getPartsToRepair());

    return new RepairingResult(this.party.getId(), Money.ZERO, handledParts);
  }
}
