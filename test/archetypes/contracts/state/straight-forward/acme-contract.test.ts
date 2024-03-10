import { v1 as uuid } from 'uuid';

import { DocumentNumber } from '../../../../../src/archetypes/contracts/better/model/content/document-number';
import { ContentId } from '../../../../../src/archetypes/contracts/better/model/content-id';
import { DocumentHeader } from '../../../../../src/archetypes/contracts/better/model/document-header';
import { DraftState } from '../../../../../src/archetypes/contracts/better/model/state/straight-forward/acme/draft-state';
import { PublishedState } from '../../../../../src/archetypes/contracts/better/model/state/straight-forward/acme/published-state';
import { VerifiedState } from '../../../../../src/archetypes/contracts/better/model/state/straight-forward/acme/verified-state';
import { BaseState } from '../../../../../src/archetypes/contracts/better/model/state/straight-forward/base-state';

describe('AcmeContract - STATE - straight-forward', () => {
  const ANY_NUMBER = new DocumentNumber('nr: 1');
  const ANY_USER = '1';
  const OTHER_USER = '2';
  const ANY_VERSION = new ContentId(uuid());
  const OTHER_VERSION = new ContentId(uuid());

  test('Only draft can be verified by user other than creator', () => {
    // given
    let state = draft().changeContent(ANY_VERSION);
    // when
    state = state.changeState(new VerifiedState(OTHER_USER));
    // then
    expect(state).toBeInstanceOf(VerifiedState);
    expect(state.getDocumentHeader().getVerifierId()).toBe(OTHER_USER);
  });

  test('Can not change published', () => {
    // given
    let state = draft()
      .changeContent(ANY_VERSION)
      .changeState(new VerifiedState(OTHER_USER))
      .changeState(new PublishedState());
    // when
    state = state.changeContent(OTHER_VERSION);
    // then
    expect(state).toBeInstanceOf(PublishedState);
    expect(state.getDocumentHeader().getContentId()).toBe(ANY_VERSION);
  });

  test('Changing verified moves to draft', () => {
    // given
    let state = draft().changeContent(ANY_VERSION);
    // when
    state = state
      .changeState(new VerifiedState(OTHER_USER))
      .changeContent(OTHER_VERSION);
    // then
    expect(state).toBeInstanceOf(DraftState);
    expect(state.getDocumentHeader().getContentId()).toBe(OTHER_VERSION);
  });

  function draft(): BaseState {
    const header = new DocumentHeader(ANY_USER, ANY_NUMBER);

    const state = new DraftState();
    state.init(header);

    return state;
  }
});
