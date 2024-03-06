import { DocumentStatus } from './document';

export class UnsupportedTransitionException extends Error {
  private current: DocumentStatus;
  private desired: DocumentStatus;

  public constructor(current: DocumentStatus, desired: DocumentStatus) {
    super(`Can not transit from ${current} to ${desired} status.`);

    this.current = current;
    this.desired = desired;
  }

  public getCurrent(): DocumentStatus {
    return this.current;
  }

  public getDesired(): DocumentStatus {
    return this.desired;
  }
}
