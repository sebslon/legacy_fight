import { State } from '../../state';

export interface IFunction<T, R> {
  apply(arg: T): R;
}

export class FixedState implements IFunction<State, State> {
  private stateName: string;

  public constructor(stateName: string) {
    this.stateName = stateName;
  }

  public apply(state: State): State {
    return state;
  }
}
