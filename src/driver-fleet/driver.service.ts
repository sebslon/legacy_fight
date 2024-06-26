import {
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as dayjs from 'dayjs';

import { TransitDetailsFacade } from '../ride/transit-details/transit-details.facade';

import { CreateDriverDto } from './create-driver.dto';
import { DriverFeeService } from './driver-fee.service';
import { DriverLicense } from './driver-license';
import { DriverDTO } from './driver.dto';
import { Driver, DriverStatus } from './driver.entity';
import { DriverRepository } from './driver.repository';

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(DriverRepository)
    private driverRepository: DriverRepository,
    private driverFeeService: DriverFeeService,
    private readonly transitDetailsFacade: TransitDetailsFacade,
  ) {}

  public async createDriver({
    photo,
    driverLicense,
    lastName,
    firstName,
    status,
    type,
  }: CreateDriverDto): Promise<Driver> {
    const driver = new Driver();

    if (status === DriverStatus.ACTIVE) {
      driver.setDriverLicense(DriverLicense.withLicense(driverLicense));
    } else {
      driver.setDriverLicense(DriverLicense.withoutValidation(driverLicense));
    }

    driver.setLastName(lastName);
    driver.setFirstName(firstName);
    driver.setStatus(status);
    driver.setType(type);

    if (photo !== null) {
      if (Buffer.from(photo, 'base64').toString('base64') === photo) {
        driver.setPhoto(photo);
      } else {
        throw new NotAcceptableException('Illegal photo in base64');
      }
    }

    return this.driverRepository.save(driver);
  }

  public async loadDriver(driverId: string): Promise<DriverDTO> {
    const driver = await this.driverRepository.findOne(driverId);

    if (!driver) {
      throw new NotFoundException(
        `Driver with id ${driverId} does not exists.`,
      );
    }

    return new DriverDTO(driver);
  }

  public async loadDrivers(ids: string[]): Promise<DriverDTO[]> {
    const drivers = await this.driverRepository.findByIds(ids);

    return drivers.map((driver) => new DriverDTO(driver));
  }

  public async changeDriverStatus(driverId: string, status: DriverStatus) {
    const driver = await this.driverRepository.findOne(driverId);

    if (!driver) {
      throw new NotFoundException(
        `Driver with id ${driverId} does not exists.`,
      );
    }

    if (status === DriverStatus.ACTIVE) {
      driver.setDriverLicense(
        DriverLicense.withLicense(driver.getDriverLicense().asString()),
      );
    }

    driver.setStatus(status);

    await this.driverRepository.update(driver.getId(), driver);
  }

  public async changeLicenseNumber(newLicense: string, driverId: string) {
    const driver = await this.driverRepository.findOne(driverId);

    if (!driver) {
      throw new NotFoundException(
        `Driver with id ${driverId} does not exists.`,
      );
    }

    if (!(driver.getStatus() === DriverStatus.ACTIVE)) {
      throw new NotAcceptableException(
        'Driver is not active, cannot change license',
      );
    }

    driver.setDriverLicense(DriverLicense.withLicense(newLicense));

    await this.driverRepository.save(driver);
  }

  public async changePhoto(driverId: string, photo: string) {
    const driver = await this.driverRepository.findOne(driverId);

    if (!driver) {
      throw new NotFoundException(
        `Driver with id ${driverId} does not exists.`,
      );
    }

    if (!photo || Buffer.from(photo, 'base64').toString('base64') === photo) {
      throw new NotAcceptableException('Illegal photo in base64');
    }
    driver.setPhoto(photo);
    await this.driverRepository.save(driver);
  }

  public async calculateDriverMonthlyPayment(
    driverId: string,
    year: number,
    month: number,
  ) {
    const driver = await this.driverRepository.findOne({
      where: {
        id: driverId,
      },
    });

    if (!driver) {
      throw new NotFoundException(
        `Driver with id ${driverId} does not exists.`,
      );
    }

    const yearMonth = dayjs(`${year}-${month}`, 'YYYY-M');
    const from = yearMonth.startOf('month').toDate();
    const to = yearMonth.endOf('month').toDate();

    const transitsList = await this.transitDetailsFacade.findByDriver(
      driverId,
      from,
      to,
    );

    const sum = (
      await Promise.all(
        transitsList.map((t) =>
          this.driverFeeService.calculateDriverFee(t.price, driverId),
        ),
      )
    ).reduce((prev, curr) => prev + curr.toInt(), 0);

    return sum;
  }

  public async calculateDriverYearlyPayment(
    driverId: string,
    year: number,
  ): Promise<Map<number, number>> {
    const payments = new Map();
    const months = Array.from(Array(12).keys()).map((m) => m + 1);

    const paymentsPromises = months.map((m) =>
      this.calculateDriverMonthlyPayment(driverId, year, m),
    );

    const paymentsList = await Promise.all(paymentsPromises);

    paymentsList.forEach((payment, i) => payments.set(i, payment));

    return payments;
  }

  public async exists(driverId: string): Promise<boolean> {
    return !!(await this.driverRepository.findOne(driverId));
  }

  public async markOccupied(driverId: string) {
    const driver = await this.driverRepository.findOne(driverId);

    if (!driver) {
      throw new NotFoundException(
        `Driver with id ${driverId} does not exists.`,
      );
    }

    driver.setOccupied(true);

    await this.driverRepository.save(driver);
  }

  public async markNotOccupied(driverId: string) {
    const driver = await this.driverRepository.findOne(driverId);

    if (!driver) {
      throw new NotFoundException(
        `Driver with id ${driverId} does not exists.`,
      );
    }

    driver.setOccupied(false);

    await this.driverRepository.save(driver);
  }
}
