import { JobDecision, JobResult } from '../job/job-result';

import { SubcontractorDriver } from './subcontractor-driver';

export class SubcontractorWithRentedCar extends SubcontractorDriver {
  protected handle(): JobResult {
    return new JobResult(JobDecision.ERROR);
  }
}
