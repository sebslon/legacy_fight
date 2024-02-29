import { UserDAO } from '../dao/user.dao';
import { CommonBaseAbstractJob } from '../job/common-base-abstract-job';
import { JobDecision, JobResult } from '../job/job-result';
import { RepairJob } from '../job/repair-job';

export class JobDoerParallelModels {
  private userDAO: UserDAO;
  private repairProcess: RepairProcess;

  public constructor(userDAO: UserDAO) {
    this.userDAO = userDAO;
  }

  public repair(userId: string, job: CommonBaseAbstractJob) {
    const user = this.userDAO.getOne(userId);
    return user.doJob(job);
  }

  public repair2parallelModels(userId: string, job: CommonBaseAbstractJob) {
    const user = this.userDAO.getOne(userId);
    const jobResult = user.doJob(job);

    const newResult = runParallelModel(userId, job);

    this.compare(newResult, jobResult);

    return jobResult;
  }

  private runParallelModel(userId: string, job: RepairJob): ResolveResult {
    const vehicle: PartyId = this.findVehicleFor(userId);
    const repairRequest = new RepairRequest(vehicle, job.getPartsToRepair());

    return this.repairProcess.resolve(repairRequest);
  }

  private findVehicleFor(userId: string): PartyId {
    // TODO: search in graph
    return new PartyId();
  }

  private compare(resolveResult: ResolveResult, jobResult: JobResult) {
    return (
      (resolveResult.getStatus() === resolveResult.Status.SUCCESS &&
        jobResult.getDecision() === JobDecision.ACCEPTED) ||
      (resolveResult.getStatus() === resolveResult.Status.ERROR &&
        jobResult.getDecision() === JobDecision.ERROR)
    );
  }
}
