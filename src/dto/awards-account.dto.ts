import { AwardsAccount } from '../miles/awards-account.entity';

import { ClientDTO } from './client.dto';

export class AwardsAccountDTO {
  private client: ClientDTO;

  private date: number;

  private isActive: boolean;

  private transactions: number;

  constructor(account: AwardsAccount, clientDTO: ClientDTO) {
    this.isActive = account.isAwardActive();
    this.client = clientDTO;
    this.transactions = account.getTransactions();
    this.date = account.getDate();
  }

  public setClient(client: ClientDTO) {
    this.client = client;
  }

  public getClient() {
    return this.client;
  }

  public setDate(date: number) {
    this.date = date;
  }

  public setActive(active: boolean) {
    this.isActive = active;
  }

  public getTransactions() {
    return this.transactions;
  }

  public setTransactions(transactions: number) {
    this.transactions = transactions;
  }

  public getDate() {
    return this.date;
  }

  public getIsActive() {
    return this.isActive;
  }
}
