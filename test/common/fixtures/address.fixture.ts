import { Address } from '../../../src/geolocation/address/address.entity';
import { AddressRepository } from '../../../src/geolocation/address/address.repository';

export class AddressFixture {
  constructor(private addressRepository: AddressRepository) {
    this.addressRepository = addressRepository;
  }

  public async createOrGetAddress(address?: Address): Promise<Address> {
    if (!address) {
      const address = new Address(
        'Polska',
        'Warszawa',
        '00-001',
        'ul. Testowa',
        1,
      );

      const addressByHash = await this.addressRepository.findOne({
        where: { hash: address.getHash() },
      });

      if (addressByHash) {
        return addressByHash;
      }

      return this.addressRepository.save(address);
    }

    const addressByHash = await this.addressRepository.findOne({
      where: { hash: address.getHash() },
    });

    if (addressByHash) {
      return addressByHash;
    }

    return this.addressRepository.save(address);
  }
}
