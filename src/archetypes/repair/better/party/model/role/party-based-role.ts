import { Party } from '../party/party';

/**
 * TODO introduce interface for an abstract class
 */
export class PartyBasedRole {
  protected party: Party;

  constructor(party: Party) {
    this.party = party;
  }
}
