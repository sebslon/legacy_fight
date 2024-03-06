import { PartyMapper } from '../party/api/party.mapper';
import { RoleObjectFactory } from '../party/api/role-object.factory';
import { PartyRelationshipDictionary } from '../model/dict/party-relationship-dictionary';
import { PartyRolesDictionary } from '../model/dict/party-roles-dictionary';
import { RoleForRepairer } from '../model/roles/repair/role-for-repairer';

import { RepairRequest } from './repair-request';
import { ResolveResult, ResolveResultStatus } from './resolve-result';

export class RepairProcess {
  private readonly partyMapper: PartyMapper;

  constructor(partyMapper: PartyMapper) {
    this.partyMapper = partyMapper;
  }

  public async resolve(repairRequest: RepairRequest): Promise<ResolveResult> {
    const relation = await this.partyMapper.mapRelation(
      repairRequest.getVehicle(),
      PartyRelationshipDictionary.REPAIR,
    );

    if (!relation) {
      return new ResolveResult(ResolveResultStatus.ERROR);
    }

    const rof = RoleObjectFactory.from(relation); // Create RoleObjectFactory from relation
    const role = rof.getRole<RoleForRepairer>(
      PartyRolesDictionary.INSURER.getRoleName(),
    ); // Find me role that implements RoleForRepairer

    if (!role) {
      return new ResolveResult(ResolveResultStatus.ERROR);
    }

    const result = role.handle(repairRequest); // Run command

    return new ResolveResult(
      ResolveResultStatus.SUCCESS,
      result.getHandlingParty(),
      result.getTotalCost(),
      result.getHandledParts(),
    );
  }
  public async resolveOldschoolVersion(
    repairRequest: RepairRequest,
  ): Promise<ResolveResult> {
    const relationship = await this.partyMapper.mapRelation(
      repairRequest.getVehicle(),
      PartyRelationshipDictionary.REPAIR,
    );

    if (!relationship) {
      return new ResolveResult(ResolveResultStatus.ERROR);
    }

    if (relationship) {
      const roleObjectFactory = RoleObjectFactory.from(relationship);
      const role = roleObjectFactory.getRole<RoleForRepairer>(
        RoleForRepairer.name,
      );

      if (role) {
        const repairingResult = role.handle(repairRequest);
        return new ResolveResult(
          ResolveResultStatus.SUCCESS,
          repairingResult.getHandlingParty(),
          repairingResult.getTotalCost(),
          repairingResult.getHandledParts(),
        );
      }
    }

    return new ResolveResult(ResolveResultStatus.ERROR);
  }
}
