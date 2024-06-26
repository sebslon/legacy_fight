import { Column, Entity, OneToMany } from 'typeorm';

import { BaseEntity } from '../common/base.entity';
import { TransitDetails } from '../ride/transit-details/transit-details.entity';

export enum ClientType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
}

export enum PaymentType {
  PRE_PAID = 'pre_paid',
  POST_PAID = 'post_paid',
  MONTHLY_INVOICE = 'monthly_invoice',
}

export enum Type {
  NORMAL = 'normal',
  VIP = 'vip',
}

@Entity()
export class Client extends BaseEntity {
  @Column()
  private type: Type;

  @Column()
  private name: string;

  @Column()
  private lastName: string;

  @Column()
  private defaultPaymentType: PaymentType;

  @Column({ type: 'enum', enum: ClientType, default: ClientType.INDIVIDUAL })
  private clientType: ClientType;

  @OneToMany(() => TransitDetails, (transitDetails) => transitDetails.client)
  public transitDetails: TransitDetails[];

  constructor(type: Type) {
    super();
    this.type = type;
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
}
