import { DocumentNumber } from '../../../../content/document-number';
import { ContentId } from '../../../../content-id';

import { ApplicationEvent } from './application-event.abstract';

export abstract class DocumentEvent extends ApplicationEvent {
  private readonly documentId: string;
  private readonly currentState: string;
  private readonly contentId: ContentId;
  private readonly number: DocumentNumber;

  public constructor(
    documentId: string,
    currentState: string,
    contentId: ContentId,
    number: DocumentNumber,
  ) {
    super(number);

    this.documentId = documentId;
    this.currentState = currentState;
    this.contentId = contentId;
    this.number = number;
  }

  public getDocumentId(): string {
    return this.documentId;
  }

  public getCurrentState(): string {
    return this.currentState;
  }

  public getContentId(): ContentId {
    return this.contentId;
  }

  public getNumber(): DocumentNumber {
    return this.number;
  }
}
