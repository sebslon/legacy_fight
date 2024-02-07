import { Test, TestingModule } from '@nestjs/testing';
import { getConnection } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { Clock } from '../../src/common/clock';
import { DriverReportController } from '../../src/controllers/driver-report.controller';
import { CarTypeDTO } from '../../src/dto/car-type.dto';
import { DriverReport } from '../../src/dto/driver-report.dto';
import { TransitDTO } from '../../src/dto/transit.dto';
import { Address } from '../../src/entity/address.entity';
import { CarClass } from '../../src/entity/car-type.entity';
import { Client } from '../../src/entity/client.entity';
import { DriverAttributeName } from '../../src/entity/driver-attribute.entity';
import { FeeType } from '../../src/entity/driver-fee.entity';
import { Driver, DriverStatus } from '../../src/entity/driver.entity';
import { AddressRepository } from '../../src/repository/address.repository';
import { ClientRepository } from '../../src/repository/client.repository';
import { DriverAttributeRepository } from '../../src/repository/driver-attribute.repository';
import { DriverFeeRepository } from '../../src/repository/driver-fee.repository';
import { TransitRepository } from '../../src/repository/transit.repository';
import { AwardsService } from '../../src/service/awards.service';
import { CarTypeService } from '../../src/service/car-type.service';
import { ClaimService } from '../../src/service/claim.service';
import { DriverSessionService } from '../../src/service/driver-session.service';
import { DriverTrackingService } from '../../src/service/driver-tracking.service';
import { DriverService } from '../../src/service/driver.service';
import { GeocodingService } from '../../src/service/geocoding.service';
import { TransitService } from '../../src/service/transit.service';
import { Fixtures } from '../common/fixtures';

describe('Create Driver Report', () => {
  const DAY_BEFORE_YESTERDAY = new Date('2021-01-01');
  const YESTERDAY = new Date('2021-01-02');
  const TODAY = new Date('2021-01-03');

  let carTypeService: CarTypeService;
  let geocodingService: GeocodingService;
  let driverSessionService: DriverSessionService;
  let driverTrackingService: DriverTrackingService;
  let transitService: TransitService;
  let driverReportController: DriverReportController;
  let driverAttributeRepository: DriverAttributeRepository;
  let clientRepository: ClientRepository;
  let driverService: DriverService;
  let driverFeeRepository: DriverFeeRepository;
  let transitRepository: TransitRepository;
  let addressRepository: AddressRepository;
  let claimService: ClaimService;
  let fixtures: Fixtures;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    carTypeService = module.get<CarTypeService>(CarTypeService);
    geocodingService = module.get<GeocodingService>(GeocodingService);
    driverSessionService =
      module.get<DriverSessionService>(DriverSessionService);
    driverTrackingService = module.get<DriverTrackingService>(
      DriverTrackingService,
    );
    driverReportController = module.get<DriverReportController>(
      DriverReportController,
    );
    driverAttributeRepository = module.get<DriverAttributeRepository>(
      DriverAttributeRepository,
    );
    clientRepository = module.get<ClientRepository>(ClientRepository);
    driverService = module.get<DriverService>(DriverService);
    driverFeeRepository = module.get<DriverFeeRepository>(DriverFeeRepository);
    claimService = module.get<ClaimService>(ClaimService);
    transitService = module.get<TransitService>(TransitService);

    fixtures = new Fixtures(
      driverService,
      driverFeeRepository,
      transitRepository,
      addressRepository,
      clientRepository,
      carTypeService,
      claimService,
      {} as AwardsService,
      driverAttributeRepository,
    );
  });

  beforeEach(async () => {
    await anActiveCarCategory(CarClass.VAN);
    await anActiveCarCategory(CarClass.PREMIUM);
  });

  afterAll(async () => {
    await getConnection().close();
  });

  it('Should create drivers report', async () => {
    const client = await fixtures.createTestClient();
    const driver = await aDriver(
      DriverStatus.ACTIVE,
      'JAN',
      'NOWAK',
      'FARME100165AB5EW',
    );

    await fixtures.driverHasAttribute(
      driver,
      DriverAttributeName.COMPANY_NAME,
      'UBER',
    );
    await fixtures.driverHasAttribute(
      driver,
      DriverAttributeName.PENALTY_POINTS,
      '21',
    );
    await fixtures.driverHasAttribute(
      driver,
      DriverAttributeName.MEDICAL_EXAMINATION_REMARKS,
      'private info',
    );

    await driverHasDoneSessionAndPicksSomeoneUpInCar(
      driver,
      client,
      CarClass.VAN,
      'WU1213',
      'SCODA FABIA',
      TODAY,
    );
    await driverHasDoneSessionAndPicksSomeoneUpInCar(
      driver,
      client,
      CarClass.VAN,
      'WU1213',
      'SCODA OCTAVIA',
      YESTERDAY,
    );
    const transitInBMW = await driverHasDoneSessionAndPicksSomeoneUpInCar(
      driver,
      client,
      CarClass.VAN,
      'WU1213',
      'BMW M2',
      DAY_BEFORE_YESTERDAY,
    );

    await fixtures.createClaim(client, transitInBMW, 'za szybko');

    const driverReportWithin2days = await loadReportIncludingPastDays(
      driver,
      2,
    );
    const driverReportWithin1day = await loadReportIncludingPastDays(driver, 1);
    const driverReportForJustToday = await loadReportIncludingPastDays(
      driver,
      0,
    );

    expect(driverReportWithin2days.getSessions().size).toBe(3);
    expect(driverReportWithin1day.getSessions().size).toBe(2);
    expect(driverReportForJustToday.getSessions().size).toBe(1);

    expect(driverReportWithin2days.getDriverDto().getDriverLicense()).toBe(
      'FARME100165AB5EW',
    );
    expect(driverReportWithin2days.getDriverDto().getFirstName()).toBe('JAN');
    expect(driverReportWithin2days.getDriverDto().getLastName()).toBe('NOWAK');
    expect(driverReportWithin2days.getAttributes().length).toBe(2);

    expect(
      driverReportWithin2days
        .getAttributes()
        .some(
          (attr) =>
            attr.getName() === DriverAttributeName.COMPANY_NAME &&
            attr.getValue() === 'UBER',
        ),
    ).toBeTruthy();

    expect(
      driverReportWithin2days
        .getAttributes()
        .some(
          (attr) =>
            attr.getName() === DriverAttributeName.PENALTY_POINTS &&
            attr.getValue() === '21',
        ),
    ).toBeTruthy();

    expect(
      driverReportWithin2days
        .getAttributes()
        .some(
          (attr) =>
            attr.getName() ===
              DriverAttributeName.MEDICAL_EXAMINATION_REMARKS &&
            attr.getValue() === 'private info',
        ),
    ).toBeFalsy();

    expect(
      transitsInSessionIn('SCODA FABIA', driverReportWithin2days).length,
    ).toBe(1);

    expect(
      transitsInSessionIn(
        'SCODA FABIA',
        driverReportWithin2days,
      )[0].getClaimDTO(),
    ).toBeNull();

    expect(
      transitsInSessionIn('SCODA OCTAVIA', driverReportWithin2days).length,
    ).toBe(1);
    expect(
      transitsInSessionIn(
        'SCODA OCTAVIA',
        driverReportWithin2days,
      )[0].getClaimDTO(),
    ).toBeNull();

    expect(transitsInSessionIn('BMW M2', driverReportWithin2days).length).toBe(
      1,
    );
    expect(
      transitsInSessionIn('BMW M2', driverReportWithin2days)[0].getClaimDTO(),
    ).not.toBeNull();
    expect(
      transitsInSessionIn('BMW M2', driverReportWithin2days)[0]
        .getClaimDTO()
        ?.getReason(),
    ).toBe('za szybko');
  });

  // Helper Functions
  async function loadReportIncludingPastDays(driver: Driver, days: number) {
    jest.spyOn(Date, 'now').mockReturnValue(TODAY.getTime());
    jest.spyOn(Clock, 'currentDate').mockReturnValue(TODAY);

    const driverReport = await driverReportController.loadReportForDriver(
      driver.getId(),
      days,
    );

    return driverReport;
  }

  function transitsInSessionIn(
    carBrand: string,
    driverReport: DriverReport,
  ): TransitDTO[] {
    const sessions = [...driverReport.getSessions().entries()];
    const transits = sessions
      .filter((e) => e[0].getCarBrand() === carBrand)
      .map((e) => e[1])
      .flat()
      .flat();

    return transits;
  }

  async function driverHasDoneSessionAndPicksSomeoneUpInCar(
    driver: Driver,
    client: Client,
    carClass: CarClass,
    plateNumber: string,
    carBrand: string,
    when: Date,
  ) {
    jest.spyOn(Date, 'now').mockReturnValue(when.getTime());
    jest.spyOn(Clock, 'currentDate').mockReturnValue(when);

    const driverId = driver.getId();
    await driverSessionService.logIn(driverId, plateNumber, carClass, carBrand);
    await driverTrackingService.registerPosition(driverId, 10, 20);

    const from = await address('PL', 'MAZ', 'WAW', 'STREET', 1, 10, 20);
    const to = await address('PL', 'MAZ', 'WAW', 'STREET', 100, 10.01, 20.01);

    const transit = await transitService.createTransit(
      client.getId(),
      from,
      to,
      carClass,
    );

    await transitService.publishTransit(transit.getId());
    await transitService.acceptTransit(driverId, transit.getId());
    await transitService.startTransit(driverId, transit.getId());
    await transitService.completeTransit(driverId, transit.getId(), to);

    await driverSessionService.logOutCurrentSession(driverId);

    return transit;
  }

  async function aDriver(
    status: DriverStatus,
    name: string,
    lastName: string,
    driverLicense: string,
  ) {
    const driver = await fixtures.createTestDriver(
      status || DriverStatus.ACTIVE,
      name,
      lastName,
      driverLicense,
    );

    await fixtures.driverHasFee(driver, FeeType.FLAT, 10, 0);
    return driver;
  }

  async function address(
    country: string,
    district: string,
    city: string,
    street: string,
    buildingNumber: number,
    latitude: number,
    longitude: number,
  ) {
    const address = new Address(
      country,
      city,
      '00-001',
      street,
      buildingNumber,
    );
    address.setDistrict(district);

    jest
      .spyOn(geocodingService, 'geocodeAddress')
      .mockReturnValue([latitude, longitude]);

    return address;
  }

  async function anActiveCarCategory(carClass: CarClass) {
    const carTypeDTO = new CarTypeDTO();

    carTypeDTO.setCarClass(carClass);
    carTypeDTO.setDescription('Test Car Type');

    const carType = await carTypeService.create(carTypeDTO);

    for (let i = 1; i < carType.getMinNoOfCarsToActivateClass() + 1; i += 1) {
      await carTypeService.registerCar(carType.getCarClass());
    }

    await carTypeService.activate(carType.getId());

    return carType;
  }
});
