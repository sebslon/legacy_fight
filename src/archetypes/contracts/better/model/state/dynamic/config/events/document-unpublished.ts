import { DocumentNumber } from '../../../../content/document-number';
import { ContentId } from '../../../../content-id';

import { DocumentEvent } from './document.event';

export class DocumentUnpublished extends DocumentEvent {
  public constructor(
    documentId: string,
    currentState: string,
    contentId: ContentId,
    number: DocumentNumber,
  ) {
    super(documentId, currentState, contentId, number);
  }
}
