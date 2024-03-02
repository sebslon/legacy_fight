import { JobDecision, JobResult } from '../job/job-result';

import { CommonBaseAbstractUser } from './common-base-abstract-user';

export class SubcontractorDriver extends CommonBaseAbstractUser {
  protected handle(): JobResult {
    return new JobResult(JobDecision.ERROR);
  }
}
