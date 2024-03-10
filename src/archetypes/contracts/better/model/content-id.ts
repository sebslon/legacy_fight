export class ContentId {
  private contentId: string;

  public constructor(contentId: string) {
    this.contentId = contentId;
  }

  public getId(): string {
    return this.contentId;
  }
}
