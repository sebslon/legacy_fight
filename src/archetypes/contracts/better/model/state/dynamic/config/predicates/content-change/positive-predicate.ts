import { State } from '../../../state';

import { Predicate } from './predicate.interface';

export class PositivePredicate implements Predicate<State> {
  public test(): boolean {
    return true;
  }
}
