import { ContentId } from '../../content-id';
import { DocumentHeader } from '../../document-header';

import { ChangeCommand } from './change-command';
import { NegativePredicate } from './config/predicates/content-change/negative-predicate';
import { Predicate } from './config/predicates/content-change/predicate.interface';
import { BiFunction } from './config/predicates/state-change/content-not-empty.verifier';
import { PositiveVerifier } from './config/predicates/state-change/positive.verifier';

export class State {
  //before: getClass().getName()
  /**
   * Unique name of a state
   */
  private readonly stateDescriptor: string;

  //TODO consider to get rid of this stateful object and transform State to reusable logic
  private documentHeader: DocumentHeader;

  //TODO consider merging contentChangePredicate and afterContentChangeState int one function
  //before: abstract canChangeContent()
  /**
   * predicates tested if content can be changed
   */
  private contentChangePredicate: Predicate<State> = new NegativePredicate();

  //before: abstract stateAfterContentChange()
  /**
   * state after content change - may be the same as before content change
   */
  private afterContentChangeState: State;

  //before: abstract canChangeFrom(state)
  /**
   * possible transitions to other states with rules that need to be tested to determine if transition is legal
   */
  private readonly stateChangePredicates: Map<
    State,
    BiFunction<State, ChangeCommand, boolean>[]
  > = new Map();

  //before: abstract acquire()
  /**
   * actions that may be needed to perform while transition to the next state
   */
  private readonly afterStateChangeActions: BiFunction<
    DocumentHeader,
    ChangeCommand,
    void
  >[] = [];

  public constructor(stateDescriptor: string) {
    this.stateDescriptor = stateDescriptor;
    this.addStateChangePredicates(this, [new PositiveVerifier()]);
  }

  public init(documentHeader: DocumentHeader): void {
    this.documentHeader = documentHeader;
    this.documentHeader.setStateDescriptor(this.getStateDescriptor());
  }

  public changeContent(currentContent: ContentId): State {
    if (!this.isContentEditable()) {
      return this;
    }

    const newState = this.afterContentChangeState;

    if (newState.contentChangePredicate.test(this)) {
      newState.init(this.documentHeader);
      this.documentHeader.changeCurrentContentId(currentContent);
      return newState;
    }

    return this;
  }

  public changeState(command: ChangeCommand) {
    const desiredState = this.find(command.getDesiredState());

    if (desiredState === null) {
      return this;
    }

    const predicates: BiFunction<State, ChangeCommand, boolean>[] =
      this.stateChangePredicates.get(desiredState) || [];

    if (predicates.every((predicate) => predicate.apply(this, command))) {
      desiredState.init(this.documentHeader);
      desiredState.afterStateChangeActions.forEach((action) =>
        action.apply(this.documentHeader, command),
      );
      return desiredState;
    }

    return this;
  }

  public getStateDescriptor(): string {
    return this.stateDescriptor;
  }

  public getDocumentHeader(): DocumentHeader {
    return this.documentHeader;
  }

  public getStateChangePredicates(): Map<
    State,
    BiFunction<State, ChangeCommand, boolean>[]
  > {
    return this.stateChangePredicates;
  }

  public getContentChangePredicate(): Predicate<State> {
    return this.contentChangePredicate;
  }

  public isContentEditable(): boolean {
    return !!this.afterContentChangeState;
  }

  public addStateChangePredicates(
    toState: State,
    predicatesToAdd: BiFunction<State, ChangeCommand, boolean>[],
  ): void {
    if (this.stateChangePredicates.has(toState)) {
      const predicates = this.stateChangePredicates.get(toState);
      predicates?.push(...predicatesToAdd);
    } else {
      this.stateChangePredicates.set(toState, predicatesToAdd);
    }
  }

  public addAfterStateChangeAction(
    action: BiFunction<DocumentHeader, ChangeCommand, void>,
  ): void {
    this.afterStateChangeActions.push(action);
  }

  public setAfterContentChangeState(state: State): void {
    this.afterContentChangeState = state;
  }

  public setContentChangePredicate(predicate: Predicate<State>): void {
    this.contentChangePredicate = predicate;
  }

  private find(state: string): State | null {
    const entries = [...this.stateChangePredicates.entries()];

    for (const [key] of entries) {
      if (key.getStateDescriptor() === state) {
        return key;
      }
    }

    return null;
  }
}
