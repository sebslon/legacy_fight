import { EntityRepository, Repository } from 'typeorm';

import { AssignmentStatus } from './assignment-status.enum';
import { DriverAssignment } from './driver-assignment.entity';

@EntityRepository(DriverAssignment)
export class DriverAssignmentRepository extends Repository<DriverAssignment> {
  public async findByRequestUUID(
    requestUUID: string,
  ): Promise<DriverAssignment | undefined> {
    return this.findOne({
      where: { requestUUID },
    });
  }

  public async findByRequestUUIDAndStatus(
    requestUUID: string,
    status: AssignmentStatus,
  ): Promise<DriverAssignment | undefined> {
    return this.findOne({
      where: { requestUUID, status },
    });
  }
}
