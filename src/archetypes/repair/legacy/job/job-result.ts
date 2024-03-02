export enum JobDecision {
  REDIRECTION = 'REDIRECTION',
  ACCEPTED = 'ACCEPTED',
  ERROR = 'ERROR',
}

export class JobResult {
  private decision: JobDecision;
  private params: Map<string, unknown> = new Map();

  public constructor(decision: JobDecision) {
    this.decision = decision;
  }

  public addParam(name: string, value: unknown) {
    this.params.set(name, value);
    return this;
  }

  public getParam(name: string) {
    return this.params.get(name);
  }

  public getDecision() {
    return this.decision;
  }
}
