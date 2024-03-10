export abstract class ApplicationEvent {
  private readonly source: object;
  private readonly timestamp: number;

  constructor(source: object) {
    this.source = source;
    this.timestamp = Date.now();
  }

  public getTimestamp(): number {
    return this.timestamp;
  }
}
