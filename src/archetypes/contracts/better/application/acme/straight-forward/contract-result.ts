import { DocumentNumber } from '../../../model/content/document-number';

export enum ContractResultStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
}

export class ContractResult {
  constructor(
    private result: ContractResultStatus,
    private documentHeaderId: string,
    private documentNumber: DocumentNumber,
    private stateDescriptor: string,
  ) {
    this.result = result;
    this.documentHeaderId = documentHeaderId;
    this.documentNumber = documentNumber;
    this.stateDescriptor = stateDescriptor;
  }

  public getResult(): ContractResultStatus {
    return this.result;
  }

  public getStateDescriptor(): string {
    return this.stateDescriptor;
  }

  public getDocumentHeaderId(): string {
    return this.documentHeaderId;
  }

  public getDocumentNumber(): DocumentNumber {
    return this.documentNumber;
  }
}
