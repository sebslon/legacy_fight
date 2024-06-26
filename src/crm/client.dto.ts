import { Client, ClientType, PaymentType, Type } from './client.entity';

export class ClientDTO {
  private id: string;

  private type: Type;

  private name: string;

  private lastName: string;

  private defaultPaymentType: PaymentType;

  private clientType: ClientType;

  private numberOfClaims: number;

  constructor(client: Client | null) {
    if (!client) {
      return this;
    }
    this.id = client.getId();
    this.type = client.getType();
    this.name = client.getName();
    this.lastName = client.getLastName();
    this.defaultPaymentType = client.getDefaultPaymentType();
    this.clientType = client.getClientType();
  }

  public getName() {
    return this.name;
  }

  public setName(name: string) {
    this.name = name;
  }

  public getLastName() {
    return this.lastName;
  }

  public setLastName(lastName: string) {
    this.lastName = lastName;
  }

  public getClientType() {
    return this.clientType;
  }

  public setClientType(clientType: ClientType) {
    this.clientType = clientType;
  }

  public getType() {
    return this.type;
  }

  public setType(type: Type) {
    this.type = type;
  }

  public getDefaultPaymentType() {
    return this.defaultPaymentType;
  }

  public setDefaultPaymentType(defaultPaymentType: PaymentType) {
    this.defaultPaymentType = defaultPaymentType;
  }

  public getId() {
    return this.id;
  }

  public setId(id: string) {
    this.id = id;
  }
}
