import { BaseState } from '../base-state';

export class ArchivedState extends BaseState {
  protected canChangeContent(): boolean {
    return false;
  }

  protected stateAfterContentChange(): BaseState {
    return this;
  }

  protected canChangeFrom(): boolean {
    return true;
  }

  protected acquire(): void {
    // Implementation goes here
  }
}
