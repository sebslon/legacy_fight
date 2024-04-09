import { v4 as uuid } from 'uuid';

import { AssignmentStatus } from '../../src/assignment/assignment-status.enum';
import { DriverAssignment } from '../../src/assignment/driver-assignment.entity';

describe('Driver Assignment', () => {
  const DRIVER = '1';
  const SECOND_DRIVER = '2';

  it('Can accept transit', () => {
    const assignment = assignmentForTransit(new Date());

    assignment.proposeTo(DRIVER);
    assignment.acceptBy(DRIVER);

    expect(assignment.getStatus()).toBe(AssignmentStatus.ON_THE_WAY);
  });

  it('Only one driver can accept transit', () => {
    const assignment = assignmentForTransit(new Date());

    assignment.proposeTo(DRIVER);
    assignment.acceptBy(DRIVER);

    expect(() => assignment.acceptBy(SECOND_DRIVER)).toThrowError();
  });

  it('Transit cannot be accepted by driver who already rejected', () => {
    const assignment = assignmentForTransit(new Date());

    assignment.rejectBy(DRIVER);

    expect(() => assignment.acceptBy(DRIVER)).toThrowError();
  });

  it('Transit cannot by accepted by driver who has not seen proposal', () => {
    const assignment = assignmentForTransit(new Date());

    expect(() => assignment.acceptBy(DRIVER)).toThrowError();
  });

  it('Can reject transit', () => {
    const assignment = assignmentForTransit(new Date());

    assignment.rejectBy(DRIVER);

    expect(assignment.getStatus()).toBe(
      AssignmentStatus.WAITING_FOR_DRIVER_ASSIGNMENT,
    );
  });

  function assignmentForTransit(when: Date) {
    return DriverAssignment.create(uuid(), when.getTime());
  }
});
