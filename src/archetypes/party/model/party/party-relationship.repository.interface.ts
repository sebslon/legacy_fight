import { PartyRelationshipDictionary } from '../../../repair/model/dict/party-relationship-dictionary';
import { PartyId } from '../../api/party-id';

import { Party } from './party';
import { PartyRelationship } from './party-relationship';

export interface PartyRelationshipRepositoryInterface {
  put(
    partyRelationship: PartyRelationshipDictionary,
    partyARole: string,
    partyA: Party,
    partyBRole: string,
    partyB: Party,
  ): Promise<PartyRelationship>;

  findRelationshipFor(
    id: PartyId,
    relationshipName: string,
  ): Promise<PartyRelationship | undefined>;
}
