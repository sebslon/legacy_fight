import { AddressDTO } from '../geolocation/address/address.dto';

export class AnalyzedAddressesDTO {
  public addresses: AddressDTO[];

  constructor(addresses: AddressDTO[]) {
    this.addresses = addresses;
  }

  public getAddresses() {
    return this.addresses;
  }

  public setAddresses(addresses: AddressDTO[]) {
    this.addresses = addresses;
  }
}
