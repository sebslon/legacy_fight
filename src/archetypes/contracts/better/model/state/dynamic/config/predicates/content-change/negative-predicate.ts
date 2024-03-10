import { State } from '../../../state';

import { Predicate } from './predicate.interface';

export class NegativePredicate implements Predicate<State> {
  public test(): boolean {
    return false;
  }
}
