import { v1 as uuid } from 'uuid';

import { DocumentNumber } from '../../../../../src/archetypes/contracts/better/model/content/document-number';
import { ContentId } from '../../../../../src/archetypes/contracts/better/model/content-id';
import { DocumentHeader } from '../../../../../src/archetypes/contracts/better/model/document-header';
import { AcmeContractStateAssembler } from '../../../../../src/archetypes/contracts/better/model/state/dynamic/acme/acme-contract-state-assembler';
import { ChangeCommand } from '../../../../../src/archetypes/contracts/better/model/state/dynamic/change-command';
import { DocumentPublished } from '../../../../../src/archetypes/contracts/better/model/state/dynamic/config/events/document-published';
import { State } from '../../../../../src/archetypes/contracts/better/model/state/dynamic/state';
import { StateConfig } from '../../../../../src/archetypes/contracts/better/model/state/dynamic/state-config.interface';

import { FakeDocumentPublisher } from './fake-document-publisher';

describe('AcmeContract - STATE - dynamic', () => {
  let publisher: FakeDocumentPublisher;

  const ANY_NUMBER = new DocumentNumber('nr: 1');
  const ANY_USER = '1';
  const OTHER_USER = '2';
  const ANY_VERSION = new ContentId(uuid());
  const OTHER_VERSION = new ContentId(uuid());

  test('Draft can be verified by user other than creator', () => {
    let state = draft().changeContent(ANY_VERSION);

    state = state.changeState(
      new ChangeCommand(AcmeContractStateAssembler.VERIFIED).withParam(
        AcmeContractStateAssembler.PARAM_VERIFIER,
        OTHER_USER,
      ),
    );

    expect(state.getStateDescriptor()).toEqual(
      AcmeContractStateAssembler.VERIFIED,
    );
    expect(state.getDocumentHeader().getVerifierId()).toEqual(OTHER_USER);
  });

  test('Can not change published', () => {
    let state = draft()
      .changeContent(ANY_VERSION)
      .changeState(
        new ChangeCommand(AcmeContractStateAssembler.VERIFIED).withParam(
          AcmeContractStateAssembler.PARAM_VERIFIER,
          OTHER_USER,
        ),
      )
      .changeState(new ChangeCommand(AcmeContractStateAssembler.PUBLISHED));

    publisher.contains(DocumentPublished.name);
    publisher.reset();

    state = state.changeContent(OTHER_VERSION);

    publisher.noEvents();

    expect(state.getStateDescriptor()).toEqual(
      AcmeContractStateAssembler.PUBLISHED,
    );
    expect(state.getDocumentHeader().getContentId()).toEqual(ANY_VERSION);
  });

  test('Changing verified moves to draft', () => {
    const header: DocumentHeader = new DocumentHeader(ANY_USER, ANY_NUMBER);
    header.setStateDescriptor(AcmeContractStateAssembler.DRAFT);

    const assembler: AcmeContractStateAssembler =
      new AcmeContractStateAssembler(publisher);
    const config: StateConfig = assembler.assemble();
    const state: State = config
      .recreate(header)
      .changeContent(ANY_VERSION)
      .changeState(
        new ChangeCommand(AcmeContractStateAssembler.VERIFIED).withParam(
          AcmeContractStateAssembler.PARAM_VERIFIER,
          OTHER_USER,
        ),
      );

    const newState: State = state.changeContent(OTHER_VERSION);

    expect(AcmeContractStateAssembler.DRAFT).toEqual(
      newState.getStateDescriptor(),
    );
    expect(OTHER_VERSION).toEqual(newState.getDocumentHeader().getContentId());
  });

  test('Can change state to the same', () => {
    let state = draft().changeContent(ANY_VERSION);
    expect(state.getStateDescriptor()).toEqual(
      AcmeContractStateAssembler.DRAFT,
    );

    state = state.changeState(
      new ChangeCommand(AcmeContractStateAssembler.DRAFT),
    );
    expect(state.getStateDescriptor()).toEqual(
      AcmeContractStateAssembler.DRAFT,
    );

    state = state.changeState(
      new ChangeCommand(AcmeContractStateAssembler.VERIFIED).withParam(
        AcmeContractStateAssembler.PARAM_VERIFIER,
        OTHER_USER,
      ),
    );
    expect(state.getStateDescriptor()).toEqual(
      AcmeContractStateAssembler.VERIFIED,
    );

    state = state.changeState(
      new ChangeCommand(AcmeContractStateAssembler.VERIFIED).withParam(
        AcmeContractStateAssembler.PARAM_VERIFIER,
        OTHER_USER,
      ),
    );
    expect(state.getStateDescriptor()).toEqual(
      AcmeContractStateAssembler.VERIFIED,
    );

    state = state.changeState(
      new ChangeCommand(AcmeContractStateAssembler.PUBLISHED),
    );
    expect(state.getStateDescriptor()).toEqual(
      AcmeContractStateAssembler.PUBLISHED,
    );

    state = state.changeState(
      new ChangeCommand(AcmeContractStateAssembler.PUBLISHED),
    );
    expect(state.getStateDescriptor()).toEqual(
      AcmeContractStateAssembler.PUBLISHED,
    );

    state = state.changeState(
      new ChangeCommand(AcmeContractStateAssembler.ARCHIVED),
    );
    expect(state.getStateDescriptor()).toEqual(
      AcmeContractStateAssembler.ARCHIVED,
    );
  });

  // HELPER FUNCTIONS

  function draft() {
    const header = new DocumentHeader(ANY_USER, ANY_NUMBER);
    header.setStateDescriptor(AcmeContractStateAssembler.DRAFT);
    publisher = new FakeDocumentPublisher();

    const assembler = new AcmeContractStateAssembler(publisher);
    const config = assembler.assemble();
    const state = config.recreate(header);

    return state;
  }
});
