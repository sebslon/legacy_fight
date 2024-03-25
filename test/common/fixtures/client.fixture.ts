import {
  Client,
  ClientType,
  PaymentType,
  Type,
} from '../../../src/crm/client.entity';
import { ClientRepository } from '../../../src/crm/client.repository';

export class ClientFixture {
  constructor(private readonly clientRepository: ClientRepository) {}

  public createClient(type?: Type) {
    const client = new Client(type ?? Type.NORMAL);

    client.setClientType(ClientType.INDIVIDUAL);
    client.setName('Tester');
    client.setLastName('Tester');
    client.setDefaultPaymentType(PaymentType.POST_PAID);

    return this.clientRepository.save(client);
  }
}
