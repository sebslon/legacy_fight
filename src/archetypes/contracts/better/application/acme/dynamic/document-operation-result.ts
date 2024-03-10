import { DocumentNumber } from '../../../model/content/document-number';
import { ContentId } from '../../../model/content-id';

export enum DocumentOperationResultStatus {
  SUCCESS,
  ERROR,
}

export class DocumentOperationResult {
  constructor(
    private result: DocumentOperationResultStatus,
    private documentHeaderId: string,
    private documentNumber: DocumentNumber,
    private stateName: string,
    private contentId: ContentId,
    private possibleTransitionsAndRules: Map<string, string[]>,
    private contentChangePossible: boolean,
    private contentChangePredicate: string | null,
  ) {
    this.result = result;
    this.documentHeaderId = documentHeaderId;
    this.documentNumber = documentNumber;
    this.stateName = stateName;
    this.contentId = contentId;
    this.possibleTransitionsAndRules = possibleTransitionsAndRules;
    this.contentChangePossible = contentChangePossible;
    this.contentChangePredicate = contentChangePredicate;
  }

  public getPossibleTransitionsAndRules(): Map<string, string[]> {
    return this.possibleTransitionsAndRules;
  }

  public getContentChangePredicate() {
    return this.contentChangePredicate;
  }

  public isContentChangePossible(): boolean {
    return this.contentChangePossible;
  }

  public getResult(): DocumentOperationResultStatus {
    return this.result;
  }

  public getStateName(): string {
    return this.stateName;
  }

  public getDocumentNumber(): DocumentNumber {
    return this.documentNumber;
  }

  public getDocumentHeaderId() {
    return this.documentHeaderId;
  }

  public getContentId(): ContentId {
    return this.contentId;
  }
}
