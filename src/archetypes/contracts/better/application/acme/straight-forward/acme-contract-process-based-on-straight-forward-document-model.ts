import { Inject, Injectable } from '@nestjs/common';

import { UserRepository } from '../../../../legacy/user.repository';
import { DocumentNumber } from '../../../model/content/document-number';
import { ContentId } from '../../../model/content-id';
import { DocumentHeader } from '../../../model/document-header';
import { DocumentHeaderRepository } from '../../../model/document-header.repository';
import { VerifiedState } from '../../../model/state/straight-forward/acme/verified-state';
import { BaseState } from '../../../model/state/straight-forward/base-state';

import { AcmeStateFactory } from './acme-state.factory';
import { ContractResult, ContractResultStatus } from './contract-result';

@Injectable()
export class AcmeContractProcessBasedOnStraightforwardDocumentModel {
  constructor(
    private userRepository: UserRepository,
    @Inject('DocumentHeaderRepository') // todo: symbol
    private documentHeaderRepository: DocumentHeaderRepository,
    private stateFactory: AcmeStateFactory,
  ) {
    this.userRepository = userRepository;
    this.documentHeaderRepository = documentHeaderRepository;
    this.stateFactory = stateFactory;
  }

  public async createContract(authorId: string): Promise<ContractResult> {
    const author = await this.userRepository.findOne(authorId);

    if (!author) {
      throw new Error('Author not found');
    }

    const number: DocumentNumber = this.generateNumber();
    const header: DocumentHeader = new DocumentHeader(author.getId(), number);

    this.documentHeaderRepository.save(header);

    return new ContractResult(
      ContractResultStatus.SUCCESS,
      header.getId(),
      number,
      header.getStateDescriptor(),
    );
  }

  public async verify(
    headerId: string,
    verifierId: string,
  ): Promise<ContractResult> {
    const verifier = this.userRepository.findOne(verifierId);
    // TODO: user authorization

    const header: DocumentHeader = await this.documentHeaderRepository.getOne(
      headerId,
    );

    let state: BaseState = this.stateFactory.create(header);
    state = state.changeState(new VerifiedState(verifierId));

    console.log(verifier, state);

    this.documentHeaderRepository.save(header);
    return new ContractResult(
      ContractResultStatus.SUCCESS,
      headerId,
      header.getDocumentNumber(),
      header.getStateDescriptor(),
    );
  }

  public async changeContent(
    headerId: string,
    contentVersion: ContentId,
  ): Promise<ContractResult> {
    const header: DocumentHeader = await this.documentHeaderRepository.getOne(
      headerId,
    );

    let state: BaseState = this.stateFactory.create(header);
    state = state.changeContent(contentVersion);

    console.log(state);

    this.documentHeaderRepository.save(header);
    return new ContractResult(
      ContractResultStatus.SUCCESS,
      headerId,
      header.getDocumentNumber(),
      header.getStateDescriptor(),
    );
  }

  private generateNumber(): DocumentNumber {
    return new DocumentNumber('nr: ' + Math.floor(Math.random() * 100)); // TODO: integrate with doc number generator
  }
}
