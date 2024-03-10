import { ContentId } from '../../content-id';
import { DocumentHeader } from '../../document-header';

// TODO: add interface

export abstract class BaseState {
  protected documentHeader: DocumentHeader;

  public init(documentHeader: DocumentHeader): void {
    this.documentHeader = documentHeader;
    this.documentHeader.setStateDescriptor(this.getStateDescriptor());
  }

  public changeContent(currentContent: ContentId) {
    if (this.canChangeContent()) {
      const newState = this.stateAfterContentChange();
      newState.init(this.documentHeader);
      this.documentHeader.changeCurrentContentId(currentContent);
      newState.acquire(this.documentHeader);
      return newState;
    }

    return this;
  }

  public changeState(newState: BaseState) {
    if (newState.canChangeFrom(this)) {
      newState.init(this.documentHeader);
      this.documentHeader.setStateDescriptor(newState.getStateDescriptor());
      newState.acquire(this.documentHeader);
      return newState;
    }

    return this;
  }

  public getStateDescriptor(): string {
    return this.constructor.name;
  }

  public getDocumentHeader(): DocumentHeader {
    return this.documentHeader;
  }

  protected abstract canChangeContent(): boolean;

  protected abstract stateAfterContentChange(): BaseState;

  /**
   * template method that allows to perform addition actions during state change
   */
  protected abstract acquire(documentHeader: DocumentHeader): void;

  protected abstract canChangeFrom(state: BaseState): boolean;
}
