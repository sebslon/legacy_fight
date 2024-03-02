import { Party } from '../../../../party/model/party/party';
import { PartyBasedRole } from '../../../../party/model/role/party-based-role';
import { AssistanceRequest } from '../../../api/assistance-request';

/**
 * Base class for all commands that are able to handle @{@link AssistanceRequest}
 */
export abstract class RoleForAssistance extends PartyBasedRole {
  constructor(party: Party) {
    super(party);
  }

  public abstract handle(request: AssistanceRequest): void;
}
