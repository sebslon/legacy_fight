import { EntityRepository, Repository } from 'typeorm';

import { PartyRelationshipDictionary } from '../../model/dict/party-relationship-dictionary';
import { PartyId } from '../api/party-id';
import { Party } from '../model/party/party';
import { PartyRelationship } from '../model/party/party-relationship';
import { PartyRelationshipRepositoryInterface } from '../model/party/party-relationship.repository.interface';

@EntityRepository(PartyRelationship)
export class PartyRelationshipRepository
  extends Repository<PartyRelationship>
  implements PartyRelationshipRepositoryInterface
{
  public async put(
    partyRelationship: PartyRelationshipDictionary,
    partyARole: string,
    partyA: Party,
    partyBRole: string,
    partyB: Party,
  ): Promise<PartyRelationship> {
    const parties = (await this.query(
      `
      SELECT r FROM PartyRelationship r
      WHERE r.name = $1
      AND (
        (r.partyA.id = $2 AND r.partyB.id = $3)
        OR
        (r.partyA.id = $3 AND r.partyB.id = $2)
      );
    `,
      [partyRelationship, partyA.getId(), partyB.getId()],
    )) as PartyRelationship[];

    let relationship: PartyRelationship;

    if (parties.length === 0) {
      relationship = new PartyRelationship(
        partyRelationship,
        partyARole,
        partyBRole,
        partyA,
        partyB,
      );
    } else {
      relationship = parties[0];
      relationship.setName(partyRelationship);
      relationship.setRoleA(partyARole);
      relationship.setRoleB(partyBRole);
      relationship.setPartyA(partyA);
      relationship.setPartyB(partyB);
    }

    return this.save(relationship);
  }

  public findRelationshipFor(
    id: PartyId,
    relationshipName: string,
  ): Promise<PartyRelationship | undefined> {
    return this.query(
      `
      SELECT r FROM PartyRelationship r
      WHERE r.name = $1
      AND (
        r.partyA.id = $2
        OR
        r.partyB.id = $2
      );
    `,
      [relationshipName, id],
    );
  }
}
