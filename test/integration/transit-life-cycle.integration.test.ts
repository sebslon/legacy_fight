import { Test, TestingModule } from '@nestjs/testing';
import { getConnection } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { AddressDto } from '../../src/dto/address.dto';
import { Address } from '../../src/entity/address.entity';
import { CarClass } from '../../src/entity/car-type.entity';
import { FeeType } from '../../src/entity/driver-fee.entity';
import { TransitStatus } from '../../src/entity/transit.entity';
import { AddressRepository } from '../../src/repository/address.repository';
import { ClientRepository } from '../../src/repository/client.repository';
import { DriverFeeRepository } from '../../src/repository/driver-fee.repository';
import { TransitRepository } from '../../src/repository/transit.repository';
import { CarTypeService } from '../../src/service/car-type.service';
import { DriverSessionService } from '../../src/service/driver-session.service';
import { DriverTrackingService } from '../../src/service/driver-tracking.service';
import { DriverService } from '../../src/service/driver.service';
import { GeocodingService } from '../../src/service/geocoding.service';
import { TransitService } from '../../src/service/transit.service';
import { Fixtures } from '../common/fixtures';

describe('Transit Life Cycle', () => {
  let transitService: TransitService;
  let driverService: DriverService;
  let driverSessionService: DriverSessionService;
  let driverTrackingService: DriverTrackingService;
  let transitRepository: TransitRepository;
  let driverFeeRepository: DriverFeeRepository;
  let addressRepository: AddressRepository;
  let clientRepository: ClientRepository;
  let carTypeService: CarTypeService;
  let geocodingService: GeocodingService;
  let fixtures: Fixtures;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    transitService = module.get<TransitService>(TransitService);
    driverService = module.get<DriverService>(DriverService);
    transitRepository = module.get<TransitRepository>(TransitRepository);
    driverFeeRepository = module.get<DriverFeeRepository>(DriverFeeRepository);
    addressRepository = module.get<AddressRepository>(AddressRepository);
    clientRepository = module.get<ClientRepository>(ClientRepository);
    carTypeService = module.get<CarTypeService>(CarTypeService); // reorder imports ;) ❗❗❗❗❗
    geocodingService = module.get<GeocodingService>(GeocodingService);
    driverSessionService =
      module.get<DriverSessionService>(DriverSessionService);
    driverTrackingService = module.get<DriverTrackingService>(
      DriverTrackingService,
    );

    fixtures = new Fixtures(
      driverService,
      driverFeeRepository,
      transitRepository,
      addressRepository,
      clientRepository,
      carTypeService,
    );
  });

  beforeEach(async () => {
    await fixtures.createActiveCarCategory(CarClass.VAN);
    geocodingService.geocodeAddress = jest.fn().mockReturnValue([1, 1]);
  });

  afterAll(async () => {
    await getConnection().close();
  });

  it('Can create transit', async () => {
    const transit = await requestTransitFromTo(
      new AddressDto({
        country: 'Poland',
        city: 'Warsaw',
        street: 'Młynarska',
        buildingNumber: 20,
        postalCode: '00-000',
      }),
      new AddressDto({
        country: 'Poland',
        city: 'Warsaw',
        street: 'Żytnia',
        buildingNumber: 25,
        postalCode: '00-000',
      }),
    );

    const loadedTransit = await transitService.loadTransit(transit.getId());

    expect(loadedTransit.getCarClass()).toBe(CarClass.VAN);
    expect(loadedTransit.getEstimatedPrice()).not.toBeNull();
    expect(loadedTransit.getPrice()).toBeNull();
    expect(loadedTransit.getFrom().getCountry()).toBe('Poland');
    expect(loadedTransit.getFrom().getCity()).toBe('Warsaw');
    expect(loadedTransit.getFrom().getStreet()).toBe('Młynarska');
    expect(loadedTransit.getFrom().getBuildingNumber()).toBe(20);
    expect(loadedTransit.getFrom().getPostalCode()).toBe('00-000');
    expect(loadedTransit.getTo().getCountry()).toBe('Poland');
    expect(loadedTransit.getTo().getCity()).toBe('Warsaw');
    expect(loadedTransit.getTo().getStreet()).toBe('Żytnia');
    expect(loadedTransit.getTo().getBuildingNumber()).toBe(25);
    expect(loadedTransit.getTo().getPostalCode()).toBe('00-000');
    expect(loadedTransit.getStatus()).toBe(TransitStatus.DRAFT);
    expect(loadedTransit.getTariff()).not.toBeNull();
    expect(loadedTransit.getKmRate()).not.toBe(0);
    expect(loadedTransit.getDateTime()).not.toBeNull();
  });

  it('Can change transit destination', async () => {
    const transit = await requestTransitFromTo(
      new AddressDto({
        country: 'Poland',
        city: 'Warsaw',
        street: 'Młynarska',
        buildingNumber: 20,
        postalCode: '00-000',
      }),
      new AddressDto({
        country: 'Poland',
        city: 'Warsaw',
        street: 'Żytnia',
        buildingNumber: 25,
        postalCode: '00-000',
      }),
    );

    await transitService.changeTransitAddressTo(
      transit.getId(),
      new AddressDto({
        country: 'Poland',
        city: 'Warsaw',
        street: 'Okopowa',
        buildingNumber: 130,
        postalCode: '00-100',
      }),
    );

    const loadedTransit = await transitService.loadTransit(transit.getId());

    expect(loadedTransit.getTo().getCountry()).toBe('Poland');
    expect(loadedTransit.getTo().getCity()).toBe('Warsaw');
    expect(loadedTransit.getTo().getStreet()).toBe('Okopowa');
    expect(loadedTransit.getTo().getBuildingNumber()).toBe(130);
    expect(loadedTransit.getTo().getPostalCode()).toBe('00-100');
    expect(loadedTransit.getEstimatedPrice()).not.toBeNull();
    expect(loadedTransit.getPrice()).toBeNull();
  });

  it("Can't change destination when transit is completed", async () => {
    const destination = new AddressDto({
      country: 'Poland',
      city: 'Warsaw',
      street: 'Żytnia',
      buildingNumber: 25,
      postalCode: '00-000',
    });

    const transit = await requestTransitFromTo(
      new AddressDto({
        country: 'Poland',
        city: 'Warsaw',
        street: 'Młynarska',
        buildingNumber: 20,
        postalCode: '00-000',
      }),
      destination,
    );

    const driver = await createNearbyDriver('WU1212');

    await transitService.publishTransit(transit.getId());
    await transitService.acceptTransit(driver, transit.getId());
    await transitService.startTransit(driver, transit.getId());
    await transitService.completeTransit(
      driver,
      transit.getId(),
      new Address(
        destination.country,
        destination.city,
        destination.postalCode,
        destination.street,
        destination.buildingNumber,
      ),
    );

    await expect(
      transitService.changeTransitAddressTo(
        transit.getId(),
        new AddressDto({
          country: 'Poland',
          city: 'Warsaw',
          street: 'Okopowa',
          buildingNumber: 130,
          postalCode: '00-100',
        }),
      ),
    ).rejects.toThrow();
  });

  async function requestTransitFromTo(
    pickup: AddressDto,
    destination: AddressDto,
  ) {
    return transitService.createTransit(
      await fixtures.createTransitDTO(pickup, destination),
    );
  }

  async function createNearbyDriver(plateNumber: string) {
    const driver = await fixtures.createTestDriver();
    await fixtures.driverHasFee(driver, FeeType.FLAT, 10, 0);

    await driverSessionService.logIn(
      driver.getId(),
      plateNumber,
      CarClass.VAN,
      'test',
    );

    await driverTrackingService.registerPosition(driver.getId(), 1, 1);

    return driver.getId();
  }
});
