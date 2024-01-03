import { getConnection } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '../src/app.module';
import { DriverDto } from '../src/dto/driver.dto';
import { DriverService } from '../src/service/driver.service';
import { Driver, DriverStatus, DriverType } from '../src/entity/driver.entity';

describe('Validate Driver License', () => {
  let driverService: DriverService;

  const validLicense = 'FARME100165AB5EW';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    driverService = module.get<DriverService>(DriverService);
  });

  afterAll(async () => {
    await getConnection().close();
  });

  describe('createDriver', () => {
    it(`Can't create active driver with invalid license`, async () => {
      await expect(createActiveDriverWithLicense('x')).rejects.toThrow();
    });

    it('Can create active driver with valid license', async () => {
      const driver: Driver = await createActiveDriverWithLicense(validLicense);

      const loadedDriver = await load(driver);

      expect(loadedDriver).toBeDefined();
      expect(loadedDriver.getDriverLicense()).toEqual(validLicense);
      expect(loadedDriver.getStatus()).toEqual(DriverStatus.ACTIVE);
    });

    it('Can create inactive driver with invalid license', async () => {
      const invalidlicense = 'x';
      const driver: Driver = await createInactiveDriverWithLicense(
        invalidlicense,
      );

      const loadedDriver = await load(driver);

      expect(loadedDriver).toBeDefined();
      expect(loadedDriver.getDriverLicense()).toEqual(invalidlicense);
      expect(loadedDriver.getStatus()).toEqual(DriverStatus.INACTIVE);
    });

    it('Can change license for valid one', async () => {
      const validlicense2 = '99999740614992TL';

      const newDriver = await createActiveDriverWithLicense(validLicense);
      await changeLicenseTo(validlicense2, newDriver);

      const driver = await load(newDriver);

      expect(driver).toBeDefined();
      expect(validlicense2).toEqual(driver.getDriverLicense());
    });

    it("Can't change license for invalid one", async () => {
      const driver = await createActiveDriverWithLicense(validLicense);

      await expect(changeLicenseTo('x', driver)).rejects.toThrow();
    });

    it('Can activete driver with valid license', async () => {
      const driver = await createInactiveDriverWithLicense(validLicense);

      await activateDriver(driver);

      const loaded = await load(driver);

      expect(loaded.getStatus()).toEqual(DriverStatus.ACTIVE);
    });

    it("Can't activate driver with invalid license", async () => {
      const driver = await createInactiveDriverWithLicense('x');

      await expect(activateDriver(driver)).rejects.toThrow();
    });
  });

  function createActiveDriverWithLicense(license: string) {
    return driverService.createDriver({
      driverLicense: license,
      firstName: 'John',
      lastName: 'Doe',
      type: DriverType.REGULAR,
      status: DriverStatus.ACTIVE,
      photo: Buffer.from('test', 'utf-8').toString('base64'),
    });
  }

  function createInactiveDriverWithLicense(license: string) {
    return driverService.createDriver({
      driverLicense: license,
      firstName: 'John',
      lastName: 'Doe',
      type: DriverType.REGULAR,
      status: DriverStatus.INACTIVE,
      photo: Buffer.from('test', 'utf-8').toString('base64'),
    });
  }

  function changeLicenseTo(newLicense: string, driver: Driver) {
    return driverService.changeLicenseNumber(newLicense, driver.getId());
  }

  function activateDriver(driver: Driver) {
    return driverService.changeDriverStatus(
      driver.getId(),
      DriverStatus.ACTIVE,
    );
  }

  async function load(driver: Driver) {
    const loaded: DriverDto = await driverService.loadDriver(driver.getId());

    return loaded;
  }
});
