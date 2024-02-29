import { UserDAO } from '../dao/user.dao';
import { CommonBaseAbstractJob } from '../job/common-base-abstract-job';
import { JobResult } from '../job/job-result';
import { RepairJob } from '../job/repair-job';

export class JobDoer {
  private userDAO: UserDAO;

  public constructor(userDAO: UserDAO) {
    this.userDAO = userDAO;
  }

  public repair(userId: string, job: RepairJob): JobResult {
    const user = this.userDAO.getOne(userId);
    return user.doJob(job);
  }

  public repair2parallelModels(userId: string, job: CommonBaseAbstractJob) {
    const user = this.userDAO.getOne(userId);
    return user.doJob(job);
  }
}
