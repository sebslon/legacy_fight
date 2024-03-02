import { Party } from '../../../../party/model/party/party';
import { PartyBasedRole } from '../../../../party/model/role/party-based-role';
import { RepairRequest } from '../../../api/repair-request';

import { RepairingResult } from './repairing-results';

export abstract class RoleForRepairer extends PartyBasedRole {
  constructor(party: Party) {
    super(party);
  }

  public abstract handle(request: RepairRequest): RepairingResult;
}
