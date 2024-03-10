import { ChangeCommand } from '../../../change-command';
import { State } from '../../../state';
import { ChangeVerifier } from '../../actions/change-verifier';

import { BiFunction } from './content-not-empty.verifier';

export class AuthorIsNotAVerifier
  implements BiFunction<State, ChangeCommand, boolean>
{
  public readonly PARAM_VERIFIER = ChangeVerifier.PARAM_VERIFIER;

  public apply(state: State, command: ChangeCommand): boolean {
    return !(
      command.getParam(this.PARAM_VERIFIER) ===
      state.getDocumentHeader().getAuthorId()
    );
  }
}
