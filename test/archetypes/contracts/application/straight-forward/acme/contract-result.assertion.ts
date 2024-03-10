import {
  ContractResult,
  ContractResultStatus,
} from '../../../../../../src/archetypes/contracts/better/application/acme/straight-forward/contract-result';
import { BaseState } from '../../../../../../src/archetypes/contracts/better/model/state/straight-forward/base-state';

export class ContractResultAssert {
  private result: ContractResult;

  constructor(result: ContractResult) {
    this.result = result;
    expect(this.result.getResult()).toBe(ContractResultStatus.SUCCESS);
  }

  public state(state: BaseState) {
    expect(this.result.getStateDescriptor()).toBe(state.getStateDescriptor());
    return this;
  }
}
