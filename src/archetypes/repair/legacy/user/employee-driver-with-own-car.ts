// import { Entity, OneToOne } from 'typeorm';

import { JobDecision, JobResult } from '../job/job-result';
import { RepairJob } from '../job/repair-job';

import { EmployeeDriver } from './employee-driver';
import { SignedContract } from './signed-contract';

// @Entity()
export class EmployeeDriverWithOwnCar extends EmployeeDriver {
  // @OneToOne(() => SignedContract)
  private contract: SignedContract;

  protected handle(job: RepairJob) {
    const acceptedParts = new Set(this.contract.getCoveredParts());

    acceptedParts.forEach((part) => {
      if (!this.contract.getCoveredParts().includes(part)) {
        acceptedParts.delete(part);
      }
    });

    const coveredCost = job
      .getEstimatedValue()
      .percentage(this.contract.getCoverageRatio());
    const totalCost = job.getEstimatedValue().subtract(coveredCost);

    return new JobResult(JobDecision.ACCEPTED)
      .addParam('totalCost', totalCost)
      .addParam('acceptedParts', acceptedParts);
  }

  public setContract(contract: SignedContract) {
    this.contract = contract;
  }
}
