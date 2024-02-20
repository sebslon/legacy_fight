import {
  Injectable,
  NotFoundException,
  NotAcceptableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Distance } from '../distance/distance';
import { TravelledDistanceService } from '../driver-report/travelled-distance/travelled-distance.service';
import { DriverPosition } from '../entity/driver-position.entity';
import { DriverStatus } from '../entity/driver.entity';
import { DriverPositionRepository } from '../repository/driver-position.repository';
import { DriverRepository } from '../repository/driver.repository';

@Injectable()
export class DriverTrackingService {
  constructor(
    @InjectRepository(DriverRepository)
    private driverRepository: DriverRepository,
    @InjectRepository(DriverPositionRepository)
    private positionRepository: DriverPositionRepository,
    private travelledDistanceService: TravelledDistanceService,
  ) {}

  public async registerPosition(
    driverId: string,
    latitude: number,
    longitude: number,
    seenAt: Date,
  ): Promise<DriverPosition> {
    const driver = await this.driverRepository.findOne(driverId);

    if (!driver) {
      throw new NotFoundException('Driver does not exists, id = ' + driverId);
    }

    if (driver.getStatus() !== DriverStatus.ACTIVE) {
      throw new NotAcceptableException(
        'Driver is not active, cannot register position, id = ' + driverId,
      );
    }

    let position = new DriverPosition(
      driver,
      seenAt.getTime(),
      latitude,
      longitude,
    );

    position = await this.positionRepository.save(position);

    await this.travelledDistanceService.addPosition(
      driverId,
      latitude,
      longitude,
      seenAt,
    );

    return position;
  }

  public async calculateTravelledDistance(
    driverId: string,
    from: number,
    to: number,
  ): Promise<Distance> {
    const driver = await this.driverRepository.findOne(driverId);

    if (!driver) {
      throw new NotFoundException('Driver does not exists, id = ' + driverId);
    }

    return this.travelledDistanceService.calculateDistance(
      driverId,
      new Date(from),
      new Date(to),
    );
  }
}
