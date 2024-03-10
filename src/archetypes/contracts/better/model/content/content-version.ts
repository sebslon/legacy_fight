export class ContentVersion {
  private contentVersion: string;

  public constructor(contentVersion: string) {
    this.contentVersion = contentVersion;
  }

  public getVersion(): string {
    return this.contentVersion;
  }
}
