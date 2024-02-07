import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Clock } from '../common/clock';
import { ClaimDto } from '../dto/claim.dto';
import { DriverAttributeDTO } from '../dto/driver-attribute.dto';
import { DriverReport } from '../dto/driver-report.dto';
import { DriverSessionDto } from '../dto/driver-session.dto';
import { TransitDto } from '../dto/transit.dto';
import { DriverAttributeName } from '../entity/driver-attribute.entity';
import { TransitStatus, Transit } from '../entity/transit.entity';
import { ClaimRepository } from '../repository/claim.repository';
import { DriverSessionRepository } from '../repository/driver-session.repository';
import { DriverRepository } from '../repository/driver.repository';
import { DriverService } from '../service/driver.service';

@Controller('driverreport')
export class DriverReportController {
  constructor(
    private driverService: DriverService,
    @InjectRepository(DriverRepository)
    private driverRepository: DriverRepository,
    @InjectRepository(ClaimRepository)
    private claimRepository: ClaimRepository,
    @InjectRepository(DriverSessionRepository)
    private driverSessionRepository: DriverSessionRepository,
  ) {}

  @Get(':driverId')
  public async loadReportForDriver(
    @Param('driverId') driverId: string,
    @Param('lastDays') lastDays: number,
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
    const sessionsWithTransits: Map<DriverSessionDto, TransitDto[]> = new Map();
    for (const session of allByDriverAndLoggedAtAfter) {
      const dto = new DriverSessionDto(session);
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

      const transitsDtosInSession: TransitDto[] = [];
      for (const t of transitsInSession) {
        const transitDTO = new TransitDto(t);
        const byOwnerAndTransit =
          await this.claimRepository.findByOwnerAndTransit(t.getClient(), t);
        if (byOwnerAndTransit.length) {
          const claim = new ClaimDto(byOwnerAndTransit[0]);
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
