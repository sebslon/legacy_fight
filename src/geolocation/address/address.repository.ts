import { EntityRepository, Repository } from 'typeorm';

import { Address } from './address.entity';

@EntityRepository(Address)
export class AddressRepository extends Repository<Address> {
  // FIX ME: To replace with getOrCreate method instead of that?
  // Actual workaround for address uniqueness problem: assign result from repo.save to variable for later usage
  //@ts-expect-error to avoid params error
  public async save(address: Address) {
    if (!address.getId()) {
      const existingAddress = await this.findOne({
        where: { hash: address.getHash() },
      });
      if (existingAddress) {
        return existingAddress;
      }
    }

    return super.save(address);
  }

  public async getOrCreate(addresss: Address) {
    const address = new Address(
      addresss.getCountry(),
      addresss.getCity(),
      addresss.getPostalCode(),
      addresss.getStreet(),
      addresss.getBuildingNumber(),
    );

    const addressByHash = await this.findOne({
      where: { hash: address.getHash() },
    });

    if (addressByHash) {
      return addressByHash;
    }

    return this.save(address);
  }

  public async findByHash(hash: string) {
    return this.findOne({
      where: { hash },
    });
  }

  public async findByHashOrFail(hash: string) {
    const address = await this.findByHash(hash);
    if (!address) {
      throw new Error('Address not found');
    }
    return address;
  }

  public findHashById(id: string) {
    return this.findOneOrFail(id).then((address) => address.getHash());
  }
}
