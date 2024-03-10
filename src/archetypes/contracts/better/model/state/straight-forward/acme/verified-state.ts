import { DocumentHeader } from '../../../document-header';
import { BaseState } from '../base-state';

import { DraftState } from './draft-state';

export class VerifiedState extends BaseState {
  private verifierId: string;

  constructor(verifierId: string) {
    super();
    this.verifierId = verifierId;
  }

  protected canChangeContent(): boolean {
    return true;
  }

  protected stateAfterContentChange(): BaseState {
    return new DraftState();
  }

  protected canChangeFrom(previousState: BaseState): boolean {
    return (
      previousState instanceof DraftState &&
      previousState.getDocumentHeader().getAuthorId() !== this.verifierId &&
      previousState.getDocumentHeader().notEmpty()
    );
  }

  protected acquire(documentHeader: DocumentHeader): void {
    documentHeader.setVerifierId(this.verifierId);
  }
}
