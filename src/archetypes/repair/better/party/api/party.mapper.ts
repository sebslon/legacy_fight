import { Injectable } from '@nestjs/common';

import { PartyRelationship } from '../model/party/party-relationship';
import { PartyRelationshipRepositoryInterface } from '../model/party/party-relationship.repository.interface';

import { PartyId } from './party-id';

@Injectable()
export class PartyMapper {
  constructor(
    private readonly partyRelationshipRepository: PartyRelationshipRepositoryInterface,
  ) {}

  public mapRelation(
    id: PartyId,
    relationshipName: string,
  ): Promise<PartyRelationship | undefined> {
    return this.partyRelationshipRepository.findRelationshipFor(
      id,
      relationshipName,
    );
  }
}
