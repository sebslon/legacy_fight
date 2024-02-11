import { Injectable, NotFoundException } from '@nestjs/common';

import { Clock } from '../common/clock';
import { ClaimDTO } from '../dto/claim.dto';
import { DriverAttributeDTO } from '../dto/driver-attribute.dto';
import { DriverReport } from '../dto/driver-report.dto';
import { DriverSessionDTO } from '../dto/driver-session.dto';
import { TransitDTO } from '../dto/transit.dto';
import { DriverAttributeName } from '../entity/driver-attribute.entity';
import { Transit, TransitStatus } from '../entity/transit.entity';
import { ClaimRepository } from '../repository/claim.repository';
import { DriverSessionRepository } from '../repository/driver-session.repository';
import { DriverRepository } from '../repository/driver.repository';
import { DriverService } from '../service/driver.service';

@Injectable()
export class OldDriverReportCreator {
  constructor(
    private driverService: DriverService,
    private driverRepository: DriverRepository,
    private driverSessionRepository: DriverSessionRepository,
    private claimRepository: ClaimRepository,
  ) {}

  public async createReport(
    driverId: string,
    lastDays: number,
  ): Promise<DriverReport> {
    const driverReport = new DriverReport();
    const driverDto = await this.driverService.loadDriver(driverId);

    driverReport.setDriverDTO(driverDto);
    const driver = await this.driverRepository.findOne(driverId, {
      relations: ['attributes', 'transits'],
    });

    if (!driver) {
      throw new NotFoundException(`Driver with id ${driverId} not exists`);
    }

    driver
      .getAttributes()
      .filter(
        (attr) =>
          attr.getName() !== DriverAttributeName.MEDICAL_EXAMINATION_REMARKS,
      )
      .forEach((attr) =>
        driverReport.getAttributes().push(new DriverAttributeDTO(attr)),
      );

    const beggingOfToday = Clock.currentDate().setHours(0, 0, 0, 0);
    const daysToSubtract = lastDays * 24 * 60 * 60 * 1000;
    const since = beggingOfToday - daysToSubtract;

    const allByDriverAndLoggedAtAfter =
      await this.driverSessionRepository.findAllByDriverAndLoggedAtAfter(
        driver,
        since.valueOf(),
      );
    const sessionsWithTransits: Map<DriverSessionDTO, TransitDTO[]> = new Map();
    for (const session of allByDriverAndLoggedAtAfter) {
      const dto = new DriverSessionDTO(session);
      const transitsInSession: Transit[] = Array.from(
        driver?.getTransits(),
      ).filter(
        (t) =>
          t.getStatus() === TransitStatus.COMPLETED &&
          !Clock.isBefore(session.getLoggedAt(), t.getCompleteAt()) &&
          !Clock.isAfter(
            session.getLoggedOutAt() || Infinity,
            t.getCompleteAt(),
          ),
      );

      const transitsDtosInSession: TransitDTO[] = [];
      for (const t of transitsInSession) {
        const transitDTO = new TransitDTO(t);
        const byOwnerAndTransit =
          await this.claimRepository.findByOwnerAndTransit(t.getClient(), t);
        if (byOwnerAndTransit.length) {
          const claim = new ClaimDTO(byOwnerAndTransit[0]);
          transitDTO.setClaimDTO(claim);
        }
        transitsDtosInSession.push(transitDTO);
      }
      sessionsWithTransits.set(dto, transitsDtosInSession);
    }
    driverReport.setSessions(sessionsWithTransits);
    return driverReport;
  }
}
