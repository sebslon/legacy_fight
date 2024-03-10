import { JobDecision } from '../../../../../src/archetypes/repair/legacy/job/job-result';
import { RepairJob } from '../../../../../src/archetypes/repair/legacy/job/repair-job';
import { Parts } from '../../../../../src/archetypes/repair/legacy/parts/parts';
import { EmployeeDriverWithOwnCar } from '../../../../../src/archetypes/repair/legacy/user/employee-driver-with-own-car';
import { SignedContract } from '../../../../../src/archetypes/repair/legacy/user/signed-contract';
import { Money } from '../../../../../src/money/money';

describe('Repair', () => {
  test('Employee driver with own car covered by warranty should repair for free', () => {
    const employee = new EmployeeDriverWithOwnCar();

    employee.setContract(fullCoverageWarranty());

    const result = employee.doJob(fullRepair());

    expect(result.getDecision()).toBe(JobDecision.ACCEPTED);
    expect(result.getParam('totalCost')).toEqual(Money.ZERO);
    expect(result.getParam('acceptedParts')).toEqual(allParts());
  });

  // Helper functions

  function fullRepair() {
    const job = new RepairJob();

    job.setEstimatedValue(new Money(50000));
    job.setPartsToRepair(allParts());

    return job;
  }

  function fullCoverageWarranty() {
    const contract = new SignedContract();

    contract.setCoveredParts(allParts());
    contract.setCoverageRatio(100);

    return contract;
  }

  function allParts() {
    return new Set(Object.values(Parts));
  }
});
