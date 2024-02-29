import { BaseEntity } from 'typeorm';

import { CommonBaseAbstractJob } from '../job/common-base-abstract-job';
import { JobResult } from '../job/job-result';
import { MaintenanceJob } from '../job/maintenance-job';
import { RepairJob } from '../job/repair-job';

export abstract class CommonBaseAbstractUser extends BaseEntity {
  public doJob(job: CommonBaseAbstractJob): JobResult {
    if (job instanceof RepairJob) {
      return this.handleRepair(job as RepairJob);
    }

    if (job instanceof MaintenanceJob) {
      return this.handleMaintenance(job as MaintenanceJob);
    }

    return this.defaultHandler(job) as unknown as JobResult;
  }

  protected handleRepair(job: RepairJob) {
    return this.defaultHandler(job) as unknown as JobResult;
  }

  protected handleMaintenance(job: MaintenanceJob) {
    return this.defaultHandler(job) as unknown as JobResult;
  }

  private defaultHandler(job: CommonBaseAbstractJob) {
    throw new Error(
      `${this.constructor.name} cannot handle ${job.constructor.name}`,
    );
  }
}
