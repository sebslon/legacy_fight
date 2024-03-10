import { Injectable } from '@nestjs/common';

import { DocumentHeader } from '../../../model/document-header';
import { DraftState } from '../../../model/state/straight-forward/acme/draft-state';
import { BaseState } from '../../../model/state/straight-forward/base-state';

@Injectable()
export class AcmeStateFactory {
  public create(header: DocumentHeader): BaseState {
    const className = header.getStateDescriptor();

    if (!className) {
      const state = new DraftState();
      state.init(header);
      return state;
    }

    try {
      Reflect.construct(BaseState, [header]);
      const state: BaseState = new (Reflect.getMetadata(
        'design:type',
        className,
      ))(header);
      state.init(header);
      return state;
    } catch (e) {
      throw new Error(`State ${className} not found`);
    }
  }
}
