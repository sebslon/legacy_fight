import { Money } from '../../../../money/money';
import { UserDAO } from '../../../repair/legacy/dao/user.dao';
import { JobDecision } from '../../../repair/legacy/job/job-result';
import { RepairJob } from '../../../repair/legacy/job/repair-job';
import { Parts } from '../../../repair/legacy/parts/parts';
import { JobDoer } from '../../../repair/legacy/service/job-doer';

describe('JobDoer', () => {
  const ANY_USER = '1';
  let jobDoer: JobDoer;

  beforeEach(() => {
    jobDoer = new JobDoer(new UserDAO());
  });

  test('Employee with own car with warranty should have covered all parts for free', () => {
    const result = jobDoer.repair(ANY_USER, repairJob());

    expect(result.getDecision()).toBe(JobDecision.ACCEPTED);
    expect(result.getParam('totalCost')).toEqual(Money.ZERO);
    expect(result.getParam('acceptedParts')).toEqual(allParts());
  });

  // Helper functions

  function repairJob() {
    const job = new RepairJob();

    job.setPartsToRepair(allParts());
    job.setEstimatedValue(new Money(7000));

    return job;
  }

  function allParts() {
    return new Set(Object.values(Parts));
  }
});
