import { Party } from '../../../party/model/party/party';
import { PartyBasedRole } from '../../../party/model/role/party-based-role';

export class Customer extends PartyBasedRole {
  public constructor(party: Party) {
    super(party);
  }
}
