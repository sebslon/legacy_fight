import { PartyId } from '../../party/api/party-id';
import { Parts } from '../legacy/parts/parts';

export class RepairRequest {
  private vehicle: PartyId;
  private partsToRepair: Set<Parts>;

  public constructor(vehicle: PartyId, partsToRepair: Set<Parts>) {
    this.vehicle = vehicle;
    this.partsToRepair = partsToRepair;
  }

  public getVehicle(): PartyId {
    return this.vehicle;
  }

  public getPartsToRepair(): Set<Parts> {
    return this.partsToRepair;
  }
}
