import { UserDAO } from '../../../../../src/archetypes/repair/legacy/dao/user.dao';
import { JobDecision } from '../../../../../src/archetypes/repair/legacy/job/job-result';
import { RepairJob } from '../../../../../src/archetypes/repair/legacy/job/repair-job';
import { Parts } from '../../../../../src/archetypes/repair/legacy/parts/parts';
import { JobDoer } from '../../../../../src/archetypes/repair/legacy/service/job-doer';
import { Money } from '../../../../../src/money/money';

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
