import { JobDecision, JobResult } from '../job/job-result';

import { EmployeeDriver } from './employee-driver';

export class EmployeeDriverWithLeasedCar extends EmployeeDriver {
  private leasingCompanyId: string;

  protected handle(): JobResult {
    return new JobResult(JobDecision.REDIRECTION).addParam(
      'shouldHandleBy',
      this.leasingCompanyId,
    );
  }

  public getLeasingCompanyId(): string {
    return this.leasingCompanyId;
  }

  public setLeasingCompanyId(leasingCompanyId: string): void {
    this.leasingCompanyId = leasingCompanyId;
  }
}
