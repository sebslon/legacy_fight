export enum CommitResultStatus {
  FAILURE = 'FAILURE',
  SUCCESS = 'SUCCESS',
}

export class CommitResult {
  private contentId: string;
  private result: CommitResultStatus;
  private message: string | null;

  public constructor(
    contentId: string,
    result: CommitResultStatus,
    message?: string,
  ) {
    this.contentId = contentId;
    this.result = result;
    this.message = message || null;
  }

  public getResult(): CommitResultStatus {
    return this.result;
  }

  public getMessage(): string | null {
    return this.message;
  }

  public getContentId(): string {
    return this.contentId;
  }
}
