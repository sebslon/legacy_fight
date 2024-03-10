import { createMock } from '@golevelup/nestjs-testing';

import { ContractManager } from '../../../../src/archetypes/repair/better/api/contract-manager';
import { RepairProcess } from '../../../../src/archetypes/repair/better/api/repair-process';
import { RepairRequest } from '../../../../src/archetypes/repair/better/api/repair-request';
import { PartyRolesDictionary } from '../../../../src/archetypes/repair/better/model/dict/party-roles-dictionary';
import { PartyId } from '../../../../src/archetypes/repair/better/party/api/party-id';
import { PartyMapper } from '../../../../src/archetypes/repair/better/party/api/party.mapper';
import { PartyRelationshipRepository } from '../../../../src/archetypes/repair/better/party/infra/party-relationship.repository';
import { PartyRepository } from '../../../../src/archetypes/repair/better/party/infra/party.repository';
import { Party } from '../../../../src/archetypes/repair/better/party/model/party/party';
import { PartyRelationship } from '../../../../src/archetypes/repair/better/party/model/party/party-relationship';
import { Parts } from '../../../../src/archetypes/repair/legacy/parts/parts';

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
    const parts = new Set([
      Parts.ENGINE,
      Parts.GEARBOX,
      Parts.PAINT,
      Parts.SUSPENSION,
    ]);

    contractManager.extendedWarrantyContractSigned(handlingParty, vehicle);

    const insurer = new Party(handlingParty.toUUID());
    const insured = new Party(vehicle.toUUID());

    partyMapper.mapRelation.mockResolvedValueOnce(
      new PartyRelationship(
        'Insurance',
        PartyRolesDictionary.INSURER.getRoleName(),
        PartyRolesDictionary.INSURED.getRoleName(),
        insurer,
        insured,
      ),
    );

    const repairRequest = new RepairRequest(vehicle, parts);

    const result = await vehicleRepairProcess.resolve(repairRequest);

    new VehicleRepairAssertion(result)
      .by(handlingParty)
      .free()
      .allPartsBut(new Set(Object.values(parts)), new Set([Parts.PAINT]));
  });
});
