export class DocumentNumber {
  private number: string;

  public constructor(number: string) {
    this.number = number;
  }

  public getNumber(): string {
    return this.number;
  }
}
