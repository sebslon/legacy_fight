import * as dayjs from 'dayjs';
import {
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Driver, DriverStatus } from '../entity/driver.entity';
import { DriverDto } from '../dto/driver.dto';
import { CreateDriverDto } from '../dto/create-driver.dto';
import { DriverRepository } from '../repository/driver.repository';
import { DriverAttributeRepository } from '../repository/driver-attribute.repository';
import { TransitRepository } from '../repository/transit.repository';
import { DriverFeeService } from './driver-fee.service';
import { DriverLicense } from '../entity/driver-license';

@Injectable()
export class DriverService {
  public static DRIVER_LICENSE_REGEX = '^[A-Z9]{5}\\d{6}[A-Z9]{2}\\d[A-Z]{2}$';

  constructor(
    @InjectRepository(DriverRepository)
    private driverRepository: DriverRepository,
    @InjectRepository(DriverAttributeRepository)
    private driverAttributeRepository: DriverAttributeRepository,
    @InjectRepository(TransitRepository)
    private transitRepository: TransitRepository,
    private driverFeeService: DriverFeeService,
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

  public async loadDriver(driverId: string): Promise<DriverDto> {
    const driver = await this.driverRepository.findOne(driverId);

    if (!driver) {
      throw new NotFoundException(
        `Driver with id ${driverId} does not exists.`,
      );
    }

    return new DriverDto(driver);
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
    const from = yearMonth.startOf('month');
    const to = yearMonth.endOf('month');

    const transitsList =
      await this.transitRepository.findAllByDriverAndDateTimeBetween(
        driver,
        from.valueOf(),
        to.valueOf(),
      );

    const sum = (
      await Promise.all(
        transitsList.map((t) =>
          this.driverFeeService.calculateDriverFee(t.getId()),
        ),
      )
    ).reduce((prev, curr) => prev + curr, 0);

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
}
