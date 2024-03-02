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
import { PartyRolesDictionary } from '../../repair/model/dict/party-roles-dictionary';

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
