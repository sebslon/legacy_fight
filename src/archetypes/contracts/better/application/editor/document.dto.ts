import { ContentVersion } from '../../model/content/content-version';

export class DocumentDTO {
  private readonly contentId: string;
  private readonly physicalContent: string;
  private readonly contentVersion: ContentVersion;

  public constructor(
    contentId: string,
    physicalContent: string,
    contentVersion: ContentVersion,
  ) {
    this.contentId = contentId;
    this.physicalContent = physicalContent;
    this.contentVersion = contentVersion;
  }

  public getContentId(): string {
    return this.contentId;
  }

  public getPhysicalContent(): string {
    return this.physicalContent;
  }

  public getDocumentVersion(): ContentVersion {
    return this.contentVersion;
  }
}
