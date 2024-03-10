import { ChangeCommand } from '../../../change-command';
import { State } from '../../../state';

export interface BiFunction<T, U, R> {
  apply(arg1: T, arg2: U): R;
}

export class ContentNotEmptyVerifier
  implements BiFunction<State, ChangeCommand, boolean>
{
  public apply(state: State): boolean {
    return state.getDocumentHeader().getContentId() !== null;
  }
}
