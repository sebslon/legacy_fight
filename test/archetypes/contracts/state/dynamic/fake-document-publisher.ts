import { EventEmitter2 } from '@nestjs/event-emitter';

export class FakeDocumentPublisher extends EventEmitter2 {
  private events: Set<unknown> = new Set();

  public emit(event: string): boolean {
    this.events.add(event);
    return true;
  }

  public contains(event: unknown): boolean {
    const has = this.events.has(event);

    expect(has).toBe(true);
    return has;
  }

  public noEvents(): void {
    expect(this.events.size).toBe(0);
  }

  public reset(): void {
    this.events.clear();
  }
}
