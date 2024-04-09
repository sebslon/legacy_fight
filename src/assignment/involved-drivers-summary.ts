import { AssignmentStatus } from './assignment-status.enum';

export class InvolvedDriversSummary {
  public proposedDrivers: string[] = [];
  public driversRejections: string[] = [];
  public assignedDriver: string | null = null;
  public assignmentStatus: AssignmentStatus;

  constructor(
    proposedDrivers: string[],
    driversRejections: string[],
    assignedDriver: string | null,
    assignmentStatus: AssignmentStatus,
  ) {
    this.proposedDrivers = proposedDrivers;
    this.driversRejections = driversRejections;
    this.assignedDriver = assignedDriver;
    this.assignmentStatus = assignmentStatus;
  }

  public static noneFound() {
    return new InvolvedDriversSummary(
      [],
      [],
      null,
      AssignmentStatus.DRIVER_ASSIGNMENT_FAILED,
    );
  }
}
