export class ChangeCommand<T = unknown> {
  private desiredState: string;
  private params: Map<string, T>;

  constructor(desiredState: string, params?: Map<string, T>) {
    this.desiredState = desiredState;
    this.params = params || new Map();
  }

  public withParam(name: string, value: T): ChangeCommand {
    this.params.set(name, value);
    return this;
  }

  public getParam<T>(name: string): T {
    return this.params.get(name) as unknown as T;
  }

  public getDesiredState(): string {
    return this.desiredState;
  }
}
