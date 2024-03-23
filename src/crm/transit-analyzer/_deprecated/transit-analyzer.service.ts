// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Client } from '../../../entity/client.entity';
import { Transit, TransitStatus } from '../../../entity/transit/transit.entity';
import { Address } from '../../../geolocation/address/address.entity';
import { AddressRepository } from '../../../geolocation/address/address.repository';
import { ClientRepository } from '../../../repository/client.repository';
import { TransitRepository } from '../../../repository/transit.repository';

// DEPRECATED since split of Transit/TransitDetails
// Kept just for reference, not used in the application.
@Injectable()
export class TransitAnalyzerService {
  constructor(
    @InjectRepository(ClientRepository)
    private clientRepository: ClientRepository,
    @InjectRepository(TransitRepository)
    private transitRepository: TransitRepository,
    @InjectRepository(AddressRepository)
    private addressRepository: AddressRepository,
  ) {}

  public async analyze(
    clientId: string,
    addressId: string,
  ): Promise<Address[]> {
    const client = await this.clientRepository.findOne(clientId);

    if (!client) {
      throw new NotFoundException('Client does not exists, id = ' + clientId);
    }

    const [address] = await this.addressRepository.find({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundException('Address does not exists, id = ' + addressId);
    }

    return this._analyze(client, address, null);
  }

  private async _analyze(
    client: Client,
    from: Address,
    currTransit: Transit | null,
  ): Promise<Address[]> {
    let transits: Transit[] = [];

    if (!currTransit) {
      transits =
        await this.transitRepository.findAllByClientAndFromAndStatusOrderByDateTimeDesc(
          client,
          from,
          TransitStatus.COMPLETED,
        );
    } else {
      transits =
        await this.transitRepository.findAllByClientAndFromAndPublishedAfterAndStatusOrderByDateTimeDesc(
          client,
          from,
          currTransit.getPublished(),
          TransitStatus.COMPLETED,
        );
    }

    // Workaround for performance reasons.
    if (transits.length > 1000 && client.getId() == '666') {
      // No one will see a difference for this customer ;)
      transits = transits.slice(0, 1000);
    }

    //        if (ts.isEmpty()) {
    //            return List.of(t.getTo());
    //        }

    if (currTransit) {
      const fifteenMinutes = 15 * 60 * 1000;
      const completedAt = new Date(+currTransit.getCompleteAt());

      transits = transits.filter((_t) => {
        const startedAt = new Date(Number(_t.getStarted() ?? 0));

        return completedAt.getTime() + fifteenMinutes > startedAt.getTime();
      });
    }

    if (!transits.length && currTransit) {
      return [currTransit.getTo()];
    }

    const accumulatedTransits: Address[][] = [];

    for (const t of transits) {
      const result = [];
      result.push(t.getFrom());
      result.push(...(await this._analyze(client, t.getTo(), t)));
      accumulatedTransits.push(result);
    }

    function sortByLength(a: Address[], b: Address[]) {
      if (a.length > b.length) return -1;
      if (a.length < b.length) return 1;
      return 0;
    }

    accumulatedTransits.sort(sortByLength);

    return accumulatedTransits[0] ?? [];
  }
}
