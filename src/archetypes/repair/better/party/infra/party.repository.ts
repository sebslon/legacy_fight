import { EntityRepository, Repository } from 'typeorm';

import { Party } from '../model/party/party';
import { PartyRepositoryInterface } from '../model/party/party.repository.interface';

@EntityRepository(Party)
export class PartyRepository
  extends Repository<Party>
  implements PartyRepositoryInterface
{
  public async put(id: string): Promise<Party> {
    const party = await this.findOne(id);

    if (!party) {
      const party = new Party();
      party.setId(id);
      return this.save(party);
    }

    return party;
  }
}
