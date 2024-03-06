import { Parts } from '../../legacy/parts/parts';
import { PartyId } from '../party/api/party-id';

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
