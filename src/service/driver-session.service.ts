import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CarClass } from '../car-fleet/car-class.enum';
import { CarTypeService } from '../car-fleet/car-type.service';
import { DriverSession } from '../entity/driver-session.entity';
import { DriverSessionRepository } from '../repository/driver-session.repository';

@Injectable()
export class DriverSessionService {
  constructor(
    @InjectRepository(DriverSessionRepository)
    private driverSessionRepository: DriverSessionRepository,
    private carTypeService: CarTypeService,
  ) {}

  public async logIn(
    driverId: string,
    plateNumber: string,
    carClass: CarClass,
    carBrand: string,
  ) {
    const session = new DriverSession();

    session.setDriverId(driverId);
    session.setLoggedAt(Date.now());
    session.setCarClass(carClass);
    session.setPlatesNumber(plateNumber);
    session.setCarBrand(carBrand);

    await this.carTypeService.registerActiveCar(session.getCarClass());

    return this.driverSessionRepository.save(session);
  }

  public async logOut(sessionId: string) {
    const session = await this.driverSessionRepository.findOne(sessionId);
    if (!session) {
      throw new NotFoundException('Session does not exist');
    }
    await this.carTypeService.unregisterCar(session.getCarClass());
    session.setLoggedOutAt(Date.now());

    await this.driverSessionRepository.save(session);
  }

  public async logOutCurrentSession(driverId: string) {
    const session =
      await this.driverSessionRepository.findTopByDriverIdAndLoggedOutAtIsNullOrderByLoggedAtDesc(
        driverId,
      );
    if (session) {
      session.setLoggedOutAt(Date.now());
      await this.carTypeService.unregisterCar(session.getCarClass());
      await this.driverSessionRepository.save(session);
    }
  }

  public async findByDriver(driverId: string): Promise<DriverSession[]> {
    return this.driverSessionRepository.findByDriverId(driverId);
  }
}
