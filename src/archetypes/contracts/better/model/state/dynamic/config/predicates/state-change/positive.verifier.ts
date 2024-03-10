import { ChangeCommand } from '../../../change-command';
import { State } from '../../../state';

import { BiFunction } from './content-not-empty.verifier';

export class PositiveVerifier
  implements BiFunction<State, ChangeCommand, boolean>
{
  public apply(): boolean {
    return true;
  }
}
