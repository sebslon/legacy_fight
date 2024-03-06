import { Injectable } from '@nestjs/common';

import { PartyRelationshipDictionary } from '../model/dict/party-relationship-dictionary';
import { PartyRolesDictionary } from '../model/dict/party-roles-dictionary';
import { PartyId } from '../party/api/party-id';
import { PartyRelationshipRepository } from '../party/infra/party-relationship.repository';
import { PartyRepository } from '../party/infra/party.repository';

@Injectable()
export class ContractManager {
  private partyRepository: PartyRepository;
  private partyRelationshipRepository: PartyRelationshipRepository;

  constructor(
    partyRepository: PartyRepository,
    partyRelationshipRepository: PartyRelationshipRepository,
  ) {
    this.partyRepository = partyRepository;
    this.partyRelationshipRepository = partyRelationshipRepository;
  }

  public async extendedWarrantyContractSigned(
    insurerId: PartyId,
    vehicleId: PartyId,
  ) {
    const insurer = await this.partyRepository.put(insurerId.toUUID());
    const vehicle = await this.partyRepository.put(vehicleId.toUUID());

    await this.partyRelationshipRepository.put(
      PartyRelationshipDictionary.REPAIR,
      PartyRolesDictionary.INSURER.getRoleName(),
      insurer,
      PartyRolesDictionary.INSURED.getRoleName(),
      vehicle,
    );
  }

  public async manufacturerWarrantyRegistered(
    distributorId: PartyId,
    vehicleId: PartyId,
  ) {
    const distributor = await this.partyRepository.put(distributorId.toUUID());
    const vehicle = await this.partyRepository.put(vehicleId.toUUID());

    await this.partyRelationshipRepository.put(
      PartyRelationshipDictionary.REPAIR,
      PartyRolesDictionary.GUARANTOR.getRoleName(),
      distributor,
      PartyRolesDictionary.CUSTOMER.getRoleName(),
      vehicle,
    );
  }
}
