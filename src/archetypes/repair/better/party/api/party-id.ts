import { v4 as uuid } from 'uuid';

export class PartyId {
  private readonly id: string;

  public constructor(id?: string) {
    this.id = id || uuid();
  }

  public getId(): string {
    return this.id;
  }

  public toUUID(): string {
    return this.id;
  }

  public equals(other: object): boolean {
    if (this === other) {
      return true;
    }
    if (other === null || !(other instanceof PartyId)) {
      return false;
    }

    return this.id === (other as PartyId).getId();
  }
}
