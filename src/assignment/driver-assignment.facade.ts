import { Injectable, NotFoundException } from '@nestjs/common';

import { CarClass } from '../car-fleet/car-class.enum';
import { CarTypeService } from '../car-fleet/car-type.service';
import { Clock } from '../common/clock';
import { Driver } from '../driver-fleet/driver.entity';
import { DriverRepository } from '../driver-fleet/driver.repository';
import { AddressDTO } from '../geolocation/address/address.dto';
import { Distance } from '../geolocation/distance';
import { DriverNotificationService } from '../notification/driver-notification.service';
import { DriverTrackingService } from '../tracking/driver-tracking.service';

import { AssignmentStatus } from './assignment-status.enum';
import { DriverAssignment } from './driver-assignment.entity';
import { DriverAssignmentRepository } from './driver-assignment.repository';
import { InvolvedDriversSummary } from './involved-drivers-summary';

@Injectable()
export class DriverAssignmentFacade {
  constructor(
    private readonly driverAssignmentRepository: DriverAssignmentRepository,
    private readonly carTypeService: CarTypeService,
    private readonly driverTrackingService: DriverTrackingService,
    private readonly driverNotificationService: DriverNotificationService,
    private readonly driverRepository: DriverRepository,
  ) {}

  public async createAssignment(
    transitRequestUUID: string,
    from: AddressDTO,
    carClass: CarClass,
    when: Date,
  ) {
    await this.driverAssignmentRepository.save(
      DriverAssignment.create(transitRequestUUID, when.getTime()),
    );

    return this.searchForPossibleDrivers(transitRequestUUID, from, carClass);
  }

  public async searchForPossibleDrivers(
    transitRequestUUID: string,
    from: AddressDTO,
    carClass: CarClass,
  ) {
    const driverAssignment = await this.find(transitRequestUUID);

    if (driverAssignment) {
      let distanceToCheck = 0;

      while (true) {
        if (driverAssignment.getAwaitingDriversResponses() > 4) {
          return InvolvedDriversSummary.noneFound();
        }

        distanceToCheck++;

        if (
          driverAssignment.shouldNotWaitForDriverAnymore(Clock.currentDate()) ||
          distanceToCheck > 20
        ) {
          driverAssignment.failDriverAssignment();

          await this.driverAssignmentRepository.save(driverAssignment);
          return InvolvedDriversSummary.noneFound();
        }

        const carClasses = await this.choosePossibleCarClasses(carClass);

        if (carClasses.length === 0) {
          return InvolvedDriversSummary.noneFound();
        }

        const driversAvgPositions =
          await this.driverTrackingService.findActiveDriversNearby(
            from,
            Distance.fromKm(distanceToCheck),
            carClasses,
          );

        if (driversAvgPositions.length === 0) {
          continue;
        }

        for (const position of driversAvgPositions) {
          if (driverAssignment.canProposeTo(position.getDriverId())) {
            driverAssignment.proposeTo(position.getDriverId());
            this.driverNotificationService.notifyAboutPossibleTransit(
              position.getDriverId(),
              transitRequestUUID,
            );
          }
        }

        await this.driverAssignmentRepository.save(driverAssignment);
      }
    } else {
      throw new NotFoundException(
        `Transit does not exist, id = ${transitRequestUUID}`,
      );
    }
  }

  public async acceptTransit(transitRequestUUID: string, driver: Driver) {
    const driverAssignment = await this.find(transitRequestUUID);

    if (!driverAssignment) {
      throw new NotFoundException(
        `Assignment does not exist, id = ${transitRequestUUID}`,
      );
    }

    driverAssignment.acceptBy(driver.getId());
    driver.setOccupied(true);

    await this.driverAssignmentRepository.save(driverAssignment);
    await this.driverRepository.save(driver);

    return this.loadInvolvedDriversByAssignment(driverAssignment);
  }

  public async cancel(transitRequestUUID: string) {
    const driverAssignment = await this.find(transitRequestUUID);

    if (driverAssignment) {
      driverAssignment.cancel();

      await this.driverAssignmentRepository.save(driverAssignment);

      this.notifyAboutCancelledDestination(
        driverAssignment,
        transitRequestUUID,
      );
    }
  }

  public async rejectTransit(transitRequestUUID: string, driverId: string) {
    const driverAssignment = await this.find(transitRequestUUID);

    if (!driverAssignment) {
      throw new NotFoundException(
        `Assignment does not exist, id = ${transitRequestUUID}`,
      );
    }

    driverAssignment.rejectBy(driverId);

    await this.driverAssignmentRepository.save(driverAssignment);

    return this.loadInvolvedDriversByAssignment(driverAssignment);
  }

  public async loadInvolvedDrivers(transitRequestUUID: string) {
    const driverAssignment = await this.find(transitRequestUUID);

    if (!driverAssignment) {
      return InvolvedDriversSummary.noneFound();
    }

    return this.loadInvolvedDriversByAssignment(driverAssignment);
  }

  public async notifyAssignedDriverAboutChangedDestination(
    transitRequestUUID: string,
  ) {
    const driverAssignment = await this.find(transitRequestUUID);

    if (driverAssignment && driverAssignment.getAssignedDriver()) {
      const assignedDriver = driverAssignment.getAssignedDriver();

      this.driverNotificationService.notifyAboutChangedTransitAddress(
        assignedDriver as string,
        transitRequestUUID,
      );

      for (const driver of driverAssignment.getProposedDrivers()) {
        this.driverNotificationService.notifyAboutChangedTransitAddress(
          driver,
          transitRequestUUID,
        );
      }
    }
  }

  public async notifyProposedDriversAboutChangedDestination(
    transitRequestUUID: string,
  ) {
    const driverAssignment = await this.find(transitRequestUUID);

    if (!driverAssignment) {
      return;
    }

    for (const driverId of driverAssignment.getProposedDrivers()) {
      this.driverNotificationService.notifyAboutChangedTransitAddress(
        driverId,
        transitRequestUUID,
      );
    }
  }

  public async isDriverAssigned(transitRequestUUID: string): Promise<boolean> {
    return (
      (await this.driverAssignmentRepository.findByRequestIdAndStatus(
        transitRequestUUID,
        AssignmentStatus.ON_THE_WAY,
      )) != null
    );
  }

  private async choosePossibleCarClasses(carClass: CarClass) {
    const carClasses: CarClass[] = [];
    const activeCarClasses = await this.carTypeService.findActiveCarClasses();

    if (carClass) {
      if (activeCarClasses.includes(carClass)) {
        carClasses.push(carClass);
      }
    } else {
      carClasses.push(...activeCarClasses);
    }

    return carClasses;
  }

  private find(transitRequestUUID: string) {
    return this.driverAssignmentRepository.findByRequestId(transitRequestUUID);
  }

  private loadInvolvedDriversByAssignment(driverAssignment: DriverAssignment) {
    return new InvolvedDriversSummary(
      driverAssignment.getProposedDrivers(),
      driverAssignment.getDriversRejections(),
      driverAssignment.getAssignedDriver(),
      driverAssignment.getStatus(),
    );
  }

  private notifyAboutCancelledDestination(
    driverAssignment: DriverAssignment,
    transitRequestUUID: string,
  ) {
    const assignedDriver = driverAssignment.getAssignedDriver();

    if (assignedDriver) {
      this.driverNotificationService.notifyAboutCancelledTransit(
        assignedDriver,
        transitRequestUUID,
      );
    }
  }
}
