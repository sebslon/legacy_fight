import { CommonBaseAbstractJob } from '../job/common-base-abstract-job';
import { JobDecision, JobResult } from '../job/job-result';

import { CommonBaseAbstractUser } from './common-base-abstract-user';

export class EmployeeDriver extends CommonBaseAbstractUser {
  protected handle(job: CommonBaseAbstractJob) {
    console.log(job);
    return new JobResult(JobDecision.ERROR);
  }
}
