import { BaseState } from '../base-state';

export class DraftState extends BaseState {
  //BAD IDEA!
  //public BaseState publish(){
  //if some validation
  //    return new PublishedState();
  //}

  protected canChangeContent(): boolean {
    return true;
  }

  protected stateAfterContentChange(): BaseState {
    return this;
  }

  protected canChangeFrom(): boolean {
    return true;
  }

  protected acquire(): void {
    // Implementation goes here
  }
}
