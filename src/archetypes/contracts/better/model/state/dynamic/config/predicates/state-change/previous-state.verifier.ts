import { ChangeCommand } from '../../../change-command';
import { State } from '../../../state';

import { BiFunction } from './content-not-empty.verifier';

export class PreviousStateVerifier
  implements BiFunction<State, ChangeCommand, boolean>
{
  private readonly stateDescriptor: string;

  public constructor(stateDescriptor: string) {
    this.stateDescriptor = stateDescriptor;
  }

  public apply(state: State): boolean {
    return state.getStateDescriptor() === this.stateDescriptor;
  }
}
