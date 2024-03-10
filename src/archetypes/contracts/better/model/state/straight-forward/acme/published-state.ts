import { BaseState } from '../base-state';

import { VerifiedState } from './verified-state';

export class PublishedState extends BaseState {
  protected canChangeContent(): boolean {
    return false;
  }

  protected stateAfterContentChange(): BaseState {
    return this;
  }

  protected canChangeFrom(previousState: BaseState): boolean {
    return (
      previousState instanceof VerifiedState &&
      previousState.getDocumentHeader().notEmpty()
    );
  }

  protected acquire(): void {
    // Implementation goes here
  }
}
