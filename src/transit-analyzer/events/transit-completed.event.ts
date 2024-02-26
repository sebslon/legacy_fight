export class TransitCompletedEvent {
  constructor(
    public readonly clientId: string,
    public readonly transitId: string,
    public readonly addressFromHash: string,
    public readonly addressToHash: string,
    public readonly started: Date,
    public readonly completedAt: Date,
  ) {}
}
