import { EntityRepository, Repository } from 'typeorm';

import { AssignmentStatus } from './assignment-status.enum';
import { DriverAssignment } from './driver-assignment.entity';

@EntityRepository(DriverAssignment)
export class DriverAssignmentRepository extends Repository<DriverAssignment> {
  public async findByRequestId(
    requestId: string,
  ): Promise<DriverAssignment | undefined> {
    return this.findOne({
      where: { requestId },
    });
  }

  public async findByRequestIdAndStatus(
    requestId: string,
    status: AssignmentStatus,
  ): Promise<DriverAssignment | undefined> {
    return this.findOne({
      where: { requestId, status },
    });
  }
}
