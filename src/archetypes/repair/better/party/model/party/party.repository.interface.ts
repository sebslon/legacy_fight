import { Party } from './party';

export interface PartyRepositoryInterface {
  put(id: string): Promise<Party>;
}
