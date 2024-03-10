import { DocumentHeader } from '../../document-header';

import { ChangeCommand } from './change-command';
import { PositivePredicate } from './config/predicates/content-change/positive-predicate';
import { BiFunction } from './config/predicates/state-change/content-not-empty.verifier';
import { PreviousStateVerifier } from './config/predicates/state-change/previous-state.verifier';
import { State } from './state';
import { StateConfig } from './state-config.interface';

export class StateBuilder implements StateConfig {
  private mode: Mode | null = null;
  //all states configured so far
  private states: Map<string, State> = new Map();

  //below is the current state of the builder, gathered whit assembling methods, current state is reset in to() method
  private fromState: State | null;
  private initialState: State | null;
  private predicates: BiFunction<State, ChangeCommand, boolean>[] | null;

  //========= methods for application layer - business process

  public begin(header: DocumentHeader): State {
    if (!this.initialState) {
      throw new Error('Initial state not set');
    }

    header.setStateDescriptor(this.initialState.getStateDescriptor());
    return this.recreate(header);
  }

  public recreate(header: DocumentHeader): State {
    const state = this.states.get(header.getStateDescriptor());

    if (!state) {
      throw new Error('State not found');
    }

    state.init(header);
    return state;
  }

  //======= methods for assembling process

  public beginWith(stateName: string): StateBuilder {
    if (this.initialState) {
      throw new Error(
        `Initial state already set to: ${this.initialState.getStateDescriptor()}`,
      );
    }

    const config = this.from(stateName);
    this.initialState = this.fromState;
    return config;
  }

  /**
   * Begins a rule sequence with a beginning state
   */
  public from(stateName: string): StateBuilder {
    this.mode = Mode.STATE_CHANGE;
    this.predicates = [];
    this.fromState = this.getOrPut(stateName);
    return this;
  }

  /**
   * Adds a rule to the current sequence
   */
  public check(
    checkingFunction: BiFunction<State, ChangeCommand, boolean>,
  ): StateBuilder {
    if (!this.mode) {
      throw new Error('Invalid operation');
    }

    this.predicates?.push(checkingFunction);
    return this;
  }

  /**
   * Ends a rule sequence with a destination state
   */
  public to(stateName: string): FinalStateConfig {
    if (!this.mode || !this.fromState || !this.predicates) {
      throw new Error('Invalid operation');
    }

    const toState = this.getOrPut(stateName);

    switch (this.mode) {
      case Mode.STATE_CHANGE:
        this.predicates.push(
          new PreviousStateVerifier(this.fromState.getStateDescriptor()),
        );
        this.fromState.addStateChangePredicates(toState, this.predicates);
        break;
      case Mode.CONTENT_CHANGE:
        this.fromState.setAfterContentChangeState(toState);
        toState.setContentChangePredicate(new PositivePredicate());
        break;
    }

    this.predicates = null;
    this.fromState = null;
    this.mode = null;

    return new FinalStateConfig(toState);
  }

  /**
   * Adds a rule of state change after a content change
   */
  public whenContentChanged(): StateBuilder {
    this.mode = Mode.CONTENT_CHANGE;
    return this;
  }

  private getOrPut(stateName: string): State {
    if (!this.states.has(stateName)) {
      this.states.set(stateName, new State(stateName));
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.states.get(stateName)!;
  }
}

//last step of the Builder - because it is special
class FinalStateConfig {
  private state: State;

  constructor(state: State) {
    this.state = state;
  }
  /**
   * Adds an operation to be performed if state have changed
   */
  public action(
    action: BiFunction<DocumentHeader, ChangeCommand, void>,
  ): FinalStateConfig {
    this.state.addAfterStateChangeAction(action);
    return this;
  }
}

/**
 * This {@link StateBuilder} state, that depends on method call
 */
enum Mode {
  /**
   * Rules for state transition {@link #check(BiFunction) check}  method called or {@link #from(String) from}  method called
   */
  STATE_CHANGE = 'STATE_CHANGE',
  /**
   * Rules for content change {@link #whenContentChanged() whenContentChanged}  method called
   */
  CONTENT_CHANGE = 'CONTENT_CHANGE',
}
