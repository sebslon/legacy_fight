import { Injectable } from '@nestjs/common';

import { UserRepository } from '../../../../legacy/user.repository';
import { DocumentNumber } from '../../../model/content/document-number';
import { ContentId } from '../../../model/content-id';
import { DocumentHeader } from '../../../model/document-header';
import { DocumentHeaderRepository } from '../../../model/document-header.repository';
import { AcmeContractStateAssembler } from '../../../model/state/dynamic/acme/acme-contract-state-assembler';
import { ChangeCommand } from '../../../model/state/dynamic/change-command';
import { State } from '../../../model/state/dynamic/state';
import { StateConfig } from '../../../model/state/dynamic/state-config.interface';

import {
  DocumentOperationResult,
  DocumentOperationResultStatus,
} from './document-operation-result';

@Injectable()
export class DocumentResourceManager {
  constructor(
    private documentHeaderRepository: DocumentHeaderRepository,
    private assembler: AcmeContractStateAssembler,
    private userRepository: UserRepository,
  ) {}

  public async createDocument(
    authorId: number,
  ): Promise<DocumentOperationResult> {
    const author = await this.userRepository.findOne(authorId);

    if (!author) {
      throw new Error('Author not found');
    }

    const number: DocumentNumber = this.generateNumber();
    const documentHeader: DocumentHeader = new DocumentHeader(
      author.getId(),
      number,
    );

    const stateConfig: StateConfig = this.assembler.assemble();
    const state: State = stateConfig.begin(documentHeader);

    this.documentHeaderRepository.save(documentHeader);

    return this.generateDocumentOperationResult(
      DocumentOperationResultStatus.SUCCESS,
      state,
    );
  }

  public async changeState(
    documentId: string,
    desiredState: string,
    params: Map<string, object>,
  ): Promise<DocumentOperationResult> {
    const documentHeader: DocumentHeader =
      await this.documentHeaderRepository.getOne(documentId);

    const stateConfig: StateConfig = this.assembler.assemble();

    let state: State = stateConfig.recreate(documentHeader);

    state = state.changeState(new ChangeCommand(desiredState, params));

    this.documentHeaderRepository.save(documentHeader);

    return this.generateDocumentOperationResult(
      DocumentOperationResultStatus.SUCCESS,
      state,
    );
  }

  public async changeContent(
    headerId: string,
    contentVersion: ContentId,
  ): Promise<DocumentOperationResult> {
    const documentHeader: DocumentHeader =
      await this.documentHeaderRepository.getOne(headerId);

    const stateConfig: StateConfig = this.assembler.assemble();

    let state: State = stateConfig.recreate(documentHeader);

    state = state.changeContent(contentVersion);

    this.documentHeaderRepository.save(documentHeader);
    return this.generateDocumentOperationResult(
      DocumentOperationResultStatus.SUCCESS,
      state,
    );
  }

  private generateDocumentOperationResult(
    result: DocumentOperationResultStatus,
    state: State,
  ): DocumentOperationResult {
    return new DocumentOperationResult(
      result,
      state.getDocumentHeader().getId(),
      state.getDocumentHeader().getDocumentNumber(),
      state.getStateDescriptor(),
      state.getDocumentHeader().getContentId(),
      this.extractPossibleTransitionsAndRules(state),
      state.isContentEditable(),
      this.extractContentChangePredicate(state),
    );
  }

  private extractContentChangePredicate(state: State): string | null {
    if (state.isContentEditable()) {
      return state.getContentChangePredicate().constructor.name;
    }
    return null;
  }

  private extractPossibleTransitionsAndRules(
    state: State,
  ): Map<string, string[]> {
    const transitionsAndRules: Map<string, string[]> = new Map();

    const stateChangePredicates = state.getStateChangePredicates();

    for (const [s, predicates] of stateChangePredicates.entries()) {
      // Transition to self is not important
      if (s === state) {
        continue;
      }

      const ruleNames: string[] = [];
      for (const predicate of predicates) {
        ruleNames.push(predicate.constructor.name);
      }
      transitionsAndRules.set(s.getStateDescriptor(), ruleNames);
    }

    return transitionsAndRules;
  }

  private generateNumber(): DocumentNumber {
    return new DocumentNumber('nr: ' + Math.floor(Math.random() * 100)); // TODO: Integrate with doc number generator
  }
}
