import { BaseEntity } from 'typeorm';

import { CommonBaseAbstractJob } from '../job/common-base-abstract-job';
import { JobResult } from '../job/job-result';
import { MaintenanceJob } from '../job/maintenance-job';
import { RepairJob } from '../job/repair-job';

export abstract class CommonBaseAbstractUser extends BaseEntity {
  public doJob(job: CommonBaseAbstractJob): JobResult {
    if (job instanceof RepairJob) {
      return this.handle(job as RepairJob);
    }

    if (job instanceof MaintenanceJob) {
      return this.handle(job as MaintenanceJob);
    }

    return this.defaultHandler(job) as unknown as JobResult;
  }

  protected abstract handle(job: CommonBaseAbstractJob): JobResult;

  private defaultHandler(job: CommonBaseAbstractJob) {
    throw new Error(
      `${this.constructor.name} cannot handle ${job.constructor.name}`,
    );
  }
}
