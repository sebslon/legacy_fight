import { createMock } from '@golevelup/nestjs-testing';

import { PartyId } from '../../party/api/party-id';
import { PartyMapper } from '../../party/api/party.mapper';
import { PartyRelationshipRepository } from '../../party/infra/party-relationship.repository';
import { PartyRepository } from '../../party/infra/party.repository';
import { Party } from '../../party/model/party/party';
import { PartyRelationship } from '../../party/model/party/party-relationship';
import { ContractManager } from '../../repair/api/contract-manager';
import { RepairProcess } from '../../repair/api/repair-process';
import { RepairRequest } from '../../repair/api/repair-request';
import { Parts } from '../../repair/legacy/parts/parts';
import { RoleForRepairer } from '../../repair/model/roles/repair/role-for-repairer';

import { VehicleRepairAssertion } from './vehicle-repair.assertion';

describe.skip('Repair Test', () => {
  let vehicleRepairProcess: RepairProcess;
  let contractManager: ContractManager;

  const partyRepository = createMock<PartyRepository>();
  const partyRelationRepository = createMock<PartyRelationshipRepository>();
  const partyMapper = createMock<PartyMapper>();

  const vehicle = new PartyId();
  const handlingParty = new PartyId();

  beforeEach(() => {
    contractManager = new ContractManager(
      partyRepository,
      partyRelationRepository,
    );
    vehicleRepairProcess = new RepairProcess(partyMapper);
  });

  test('Warranty by insurance covers all but not paint', async () => {
    const party1 = new Party(handlingParty.toUUID());
    const party2 = new Party(vehicle.toUUID());

    partyMapper.mapRelation.mockResolvedValueOnce(
      new PartyRelationship(
        'party',
        RoleForRepairer.name,
        'roleB',
        party1,
        party2,
      ),
    );

    contractManager.extendedWarrantyContractSigned(handlingParty, vehicle);

    const parts = new Set([
      Parts.ENGINE,
      Parts.GEARBOX,
      Parts.PAINT,
      Parts.SUSPENSION,
    ]);

    const repairRequest = new RepairRequest(vehicle, parts);
    const result = await vehicleRepairProcess.resolve(repairRequest);

    new VehicleRepairAssertion(result)
      .by(handlingParty)
      .free()
      .allPartsBut(new Set(Object.values(parts)), new Set([Parts.PAINT]));
  });
});
