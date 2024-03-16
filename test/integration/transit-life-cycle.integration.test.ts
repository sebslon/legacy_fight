import { Test, TestingModule } from '@nestjs/testing';
import { getConnection } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { Clock } from '../../src/common/clock';
import { AddressDTO } from '../../src/dto/address.dto';
import { Address } from '../../src/entity/address.entity';
import { CarClass } from '../../src/entity/car-type.entity';
import { FeeType } from '../../src/entity/driver-fee.entity';
import { TransitStatus } from '../../src/entity/transit/transit.entity';
import { DriverPositionRepository } from '../../src/repository/driver-position.repository';
import { DriverSessionService } from '../../src/service/driver-session.service';
import { DriverTrackingService } from '../../src/service/driver-tracking.service';
import { GeocodingService } from '../../src/service/geocoding.service';
import { TransitService } from '../../src/service/transit.service';
import { Fixtures } from '../common/fixtures';

describe('Transit Life Cycle', () => {
  let transitService: TransitService;
  let driverSessionService: DriverSessionService;
  let driverTrackingService: DriverTrackingService;
  let geocodingService: GeocodingService;
  let fixtures: Fixtures;
  let positionRepository: DriverPositionRepository;

  const addressData = {
    country: 'Poland',
    city: 'Warsaw',
    street: 'Młynarska',
    buildingNumber: 20,
    postalCode: '00-000',
  };
  const addressData2 = {
    country: 'Poland',
    city: 'Warsaw',
    street: 'Żytnia',
    buildingNumber: 25,
    postalCode: '00-000',
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    transitService = module.get<TransitService>(TransitService);
    geocodingService = module.get<GeocodingService>(GeocodingService);
    driverSessionService =
      module.get<DriverSessionService>(DriverSessionService);
    driverTrackingService = module.get<DriverTrackingService>(
      DriverTrackingService,
    );
    positionRepository = module.get<DriverPositionRepository>(
      DriverPositionRepository,
    );

    fixtures = module.get<Fixtures>(Fixtures);
  });

  beforeEach(async () => {
    await positionRepository.clear();
    await fixtures.createActiveCarCategory(CarClass.VAN);
    geocodingService.geocodeAddress = jest.fn().mockReturnValue([1, 1]);
  });

  afterAll(async () => {
    await getConnection().close();
  });

  it('Can create transit', async () => {
    const transit = await requestTransitFromTo(
      new AddressDTO(addressData),
      new AddressDTO(addressData2),
    );

    const loadedTransit = await transitService.loadTransit(transit.getId());

    expect(loadedTransit.getCarClass()).toBe(CarClass.VAN);
    expect(loadedTransit.getEstimatedPrice()).not.toBeNull();
    expect(loadedTransit.getPrice()).toBeNull();
    expect(loadedTransit.getFrom().getCountry()).toBe(addressData.country);
    expect(loadedTransit.getFrom().getCity()).toBe(addressData.city);
    expect(loadedTransit.getFrom().getStreet()).toBe(addressData.street);
    expect(loadedTransit.getFrom().getBuildingNumber()).toBe(
      addressData.buildingNumber,
    );
    expect(loadedTransit.getFrom().getPostalCode()).toBe(
      addressData.postalCode,
    );
    expect(loadedTransit.getTo().getCountry()).toBe(addressData2.country);
    expect(loadedTransit.getTo().getCity()).toBe(addressData2.city);
    expect(loadedTransit.getTo().getStreet()).toBe(addressData2.street);
    expect(loadedTransit.getTo().getBuildingNumber()).toBe(
      addressData2.buildingNumber,
    );
    expect(loadedTransit.getTo().getPostalCode()).toBe(addressData2.postalCode);
    expect(loadedTransit.getStatus()).toBe(TransitStatus.DRAFT);
    expect(loadedTransit.getTariff()).not.toBeNull();
    expect(loadedTransit.getKmRate()).not.toBe(0);
    expect(loadedTransit.getDateTime()).not.toBeNull();
  });

  it('Can change transit destination', async () => {
    const transit = await requestTransitFromTo(
      new AddressDTO(addressData),
      new AddressDTO(addressData2),
    );

    const newDestination = {
      country: 'Poland',
      city: 'Warsaw',
      street: 'Okopowa',
      buildingNumber: 130,
      postalCode: '00-100',
    };

    await transitService.changeTransitAddressTo(
      transit.getId(),
      new AddressDTO(newDestination),
    );

    const loadedTransit = await transitService.loadTransit(transit.getId());

    expect(loadedTransit.getTo().getCountry()).toBe(newDestination.country);
    expect(loadedTransit.getTo().getCity()).toBe(newDestination.city);
    expect(loadedTransit.getTo().getStreet()).toBe(newDestination.street);
    expect(loadedTransit.getTo().getBuildingNumber()).toBe(
      newDestination.buildingNumber,
    );
    expect(loadedTransit.getTo().getPostalCode()).toBe(
      newDestination.postalCode,
    );
    expect(loadedTransit.getEstimatedPrice()).not.toBeNull();
    expect(loadedTransit.getPrice()).toBeNull();
  });

  it("Can't change destination when transit is completed", async () => {
    const destination = new AddressDTO({
      country: 'Poland',
      city: 'Warsaw',
      street: 'Żytnia',
      buildingNumber: 25,
      postalCode: '00-000',
    });

    const transit = await requestTransitFromTo(
      new AddressDTO(addressData),
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
        new AddressDTO({
          country: 'Poland',
          city: 'Warsaw',
          street: 'Okopowa',
          buildingNumber: 130,
          postalCode: '00-100',
        }),
      ),
    ).rejects.toThrow();
  });

  it('Can change pickup place', async () => {
    const transit = await requestTransitFromTo(
      new AddressDTO(addressData),
      new AddressDTO(addressData2),
    );

    const pickup = {
      country: 'Poland',
      city: 'Warsaw',
      street: 'Okopowa',
      buildingNumber: 130,
      postalCode: '00-100',
    };

    await transitService.changeTransitAddressFrom(
      transit.getId(),
      new AddressDTO(pickup),
    );

    const loadedTransit = await transitService.loadTransit(transit.getId());

    expect(loadedTransit.getFrom().getCountry()).toBe(pickup.country);
    expect(loadedTransit.getFrom().getCity()).toBe(pickup.city);
    expect(loadedTransit.getFrom().getStreet()).toBe(pickup.street);
    expect(loadedTransit.getFrom().getBuildingNumber()).toBe(
      pickup.buildingNumber,
    );
    expect(loadedTransit.getFrom().getPostalCode()).toBe(pickup.postalCode);
  });

  it("Can't change pickup place after transit is accepted, in progress, or completed", async () => {
    const destination = new AddressDTO({
      country: 'Poland',
      city: 'Warsaw',
      street: 'Żytnia',
      buildingNumber: 25,
      postalCode: '00-000',
    });

    const transit = await requestTransitFromTo(
      new AddressDTO(addressData),
      destination,
    );

    const changedTo = new AddressDTO({
      country: 'Poland',
      city: 'Warsaw',
      street: 'Okopowa',
      buildingNumber: 130,
      postalCode: '00-100',
    });

    const driver = await createNearbyDriver('WU1212');

    await transitService.publishTransit(transit.getId());
    await transitService.acceptTransit(driver, transit.getId());

    await expect(
      transitService.changeTransitAddressFrom(transit.getId(), changedTo),
    ).rejects.toThrow();

    await transitService.startTransit(driver, transit.getId());

    await expect(
      transitService.changeTransitAddressFrom(transit.getId(), changedTo),
    ).rejects.toThrow();

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
      transitService.changeTransitAddressFrom(transit.getId(), changedTo),
    ).rejects.toThrow();
  });

  it("Can't change pickup place more than three times", async () => {
    const transit = await requestTransitFromTo(
      new AddressDTO(addressData),
      new AddressDTO(addressData2),
    );

    const newAddress = new AddressDTO({
      country: 'Poland',
      city: 'Warsaw',
      street: 'Okopowa',
      buildingNumber: 130,
      postalCode: '00-100',
    });

    await transitService.changeTransitAddressFrom(transit.getId(), newAddress);
    await transitService.changeTransitAddressFrom(transit.getId(), newAddress);
    await transitService.changeTransitAddressFrom(transit.getId(), newAddress);

    await expect(
      transitService.changeTransitAddressFrom(transit.getId(), newAddress),
    ).rejects.toThrow();
  });

  it("Can't change pickup place when it's far way from original", async () => {
    const transit = await requestTransitFromTo(
      new AddressDTO(addressData),
      new AddressDTO(addressData2),
    );

    const newAddress = farAwayAddress();

    await expect(
      transitService.changeTransitAddressFrom(transit.getId(), newAddress),
    ).rejects.toThrow();
  });

  it('Can cancel transit', async () => {
    const transit = await requestTransitFromTo(
      new AddressDTO(addressData),
      new AddressDTO(addressData2),
    );

    await transitService.cancelTransit(transit.getId());

    const loadedTransit = await transitService.loadTransit(transit.getId());

    expect(loadedTransit.getStatus()).toBe(TransitStatus.CANCELLED);
  });

  it("Can't cancel transit after it was started or completed", async () => {
    const destination = new AddressDTO({
      country: 'Poland',
      city: 'Warsaw',
      street: 'Żytnia',
      buildingNumber: 25,
      postalCode: '00-000',
    });

    const transit = await requestTransitFromTo(
      new AddressDTO(addressData),
      destination,
    );

    const driver = await createNearbyDriver('WU1212'); // HERE CHECK

    await transitService.publishTransit(transit.getId());
    await transitService.acceptTransit(driver, transit.getId());
    await transitService.startTransit(driver, transit.getId());

    await expect(
      transitService.cancelTransit(transit.getId()),
    ).rejects.toThrow();

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
      transitService.cancelTransit(transit.getId()),
    ).rejects.toThrow();
  });

  it('Can publish transit', async () => {
    const transit = await requestTransitFromTo(
      new AddressDTO(addressData),
      new AddressDTO(addressData2),
    );

    await createNearbyDriver('WU1212');
    await createMinimumAmountOfDriversToNotFailAssignment();

    await transitService.publishTransit(transit.getId());

    const loadedTransit = await transitService.loadTransit(transit.getId());

    expect(loadedTransit.getStatus()).toBe(
      TransitStatus.WAITING_FOR_DRIVER_ASSIGNMENT,
    );
    expect(loadedTransit.getPublished()).not.toBeNull();
  });

  it('Can accept transit', async () => {
    const transit = await requestTransitFromTo(
      new AddressDTO(addressData),
      new AddressDTO(addressData2),
    );

    const driver = await createNearbyDriver('WU1212');

    await transitService.publishTransit(transit.getId());
    await transitService.acceptTransit(driver, transit.getId());

    const loadedTransit = await transitService.loadTransit(transit.getId());

    expect(loadedTransit.getStatus()).toBe(TransitStatus.TRANSIT_TO_PASSENGER);
    expect(loadedTransit.getAcceptedAt()).not.toBeNull();
  });

  it('Only one driver can accept transit', async () => {
    const transit = await requestTransitFromTo(
      new AddressDTO(addressData),
      new AddressDTO(addressData2),
    );

    const driver1 = await createNearbyDriver('WU1212');
    const driver2 = await createNearbyDriver('WU1213');

    await transitService.publishTransit(transit.getId());

    await transitService.acceptTransit(driver1, transit.getId());

    await expect(
      transitService.acceptTransit(driver2, transit.getId()),
    ).rejects.toThrow();
  });

  it("Transit can't be accepted by driver who already rejected it", async () => {
    const transit = await requestTransitFromTo(
      new AddressDTO(addressData),
      new AddressDTO(addressData2),
    );

    const driver = await createNearbyDriver('WU1212');

    await transitService.publishTransit(transit.getId());
    await transitService.rejectTransit(driver, transit.getId());

    await expect(
      transitService.acceptTransit(driver, transit.getId()),
    ).rejects.toThrow();
  });

  it("Transit can't be accepted by driver who has not seen proposal", async () => {
    const transit = await requestTransitFromTo(
      new AddressDTO(addressData),
      new AddressDTO(addressData2),
    );

    const driver = await farAwayDriver('WU1212');

    await transitService.publishTransit(transit.getId());

    await expect(
      transitService.acceptTransit(driver, transit.getId()),
    ).rejects.toThrow();
  });

  it('Can start transit', async () => {
    const transit = await requestTransitFromTo(
      new AddressDTO(addressData),
      new AddressDTO(addressData2),
    );

    const driver = await createNearbyDriver('WU1212');

    await transitService.publishTransit(transit.getId());
    await transitService.acceptTransit(driver, transit.getId());
    await transitService.startTransit(driver, transit.getId());

    const loadedTransit = await transitService.loadTransit(transit.getId());

    expect(loadedTransit.getStatus()).toBe(TransitStatus.IN_TRANSIT);
    expect(loadedTransit.getStarted()).not.toBeNull();
  });

  it("Can't start not accepted transit", async () => {
    const transit = await requestTransitFromTo(
      new AddressDTO(addressData),
      new AddressDTO(addressData2),
    );

    const driver = await createNearbyDriver('WU1212');

    await transitService.publishTransit(transit.getId());

    await expect(
      transitService.startTransit(driver, transit.getId()),
    ).rejects.toThrow();
  });

  it('Can complete transit', async () => {
    const destination = new AddressDTO({
      country: 'Poland',
      city: 'Warsaw',
      street: 'Żytnia',
      buildingNumber: 25,
      postalCode: '00-000',
    });

    const transit = await requestTransitFromTo(
      new AddressDTO(addressData),
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

    const loadedTransit = await transitService.loadTransit(transit.getId());

    expect(loadedTransit.getStatus()).toBe(TransitStatus.COMPLETED);
    expect(loadedTransit.getTariff()).not.toBeNull();
    expect(loadedTransit.getPrice()).not.toBeNull();
    expect(loadedTransit.getDriverFee()).not.toBeNull();
    expect(loadedTransit.getCompleteAt()).not.toBeNull();
  });

  it("Can't complete not started transit", async () => {
    const destination = new AddressDTO({
      country: 'Poland',
      city: 'Warsaw',
      street: 'Żytnia',
      buildingNumber: 25,
      postalCode: '00-000',
    });

    const transit = await requestTransitFromTo(
      new AddressDTO(addressData),
      destination,
    );

    const driver = await createNearbyDriver('WU1212');

    await transitService.publishTransit(transit.getId());
    await transitService.acceptTransit(driver, transit.getId());

    await expect(
      transitService.completeTransit(
        driver,
        transit.getId(),
        new Address(
          destination.country,
          destination.city,
          destination.postalCode,
          destination.street,
          destination.buildingNumber,
        ),
      ),
    ).rejects.toThrow();
  });

  it('Can reject transit', async () => {
    const transit = await requestTransitFromTo(
      new AddressDTO(addressData),
      new AddressDTO(addressData2),
    );

    const driver = await createNearbyDriver('WU1212');
    await createMinimumAmountOfDriversToNotFailAssignment();

    await transitService.publishTransit(transit.getId());
    await transitService.rejectTransit(driver, transit.getId());

    const loadedTransit = await transitService.loadTransit(transit.getId());

    expect(loadedTransit.getStatus()).toBe(
      TransitStatus.WAITING_FOR_DRIVER_ASSIGNMENT,
    );
    expect(loadedTransit.getAcceptedAt()).toBeNull();
  });

  // HELPER FUNCTIONS

  async function requestTransitFromTo(
    pickup: AddressDTO,
    destination: AddressDTO,
  ) {
    return transitService.createTransitFromDTO(
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

    await driverTrackingService.registerPosition(
      driver.getId(),
      1,
      1,
      Clock.currentDate(),
    );

    return driver.getId();
  }

  async function farAwayDriver(plateNumber: string) {
    const driver = await fixtures.createTestDriver();
    await fixtures.driverHasFee(driver, FeeType.FLAT, 10, 0);

    await driverSessionService.logIn(
      driver.getId(),
      plateNumber,
      CarClass.VAN,
      'test',
    );
    await driverTrackingService.registerPosition(
      driver.getId(),
      1000,
      1000,
      Clock.currentDate(),
    );

    return driver.getId();
  }

  function farAwayAddress() {
    const addressDto = new AddressDTO({
      country: 'Denmark',
      city: 'Copenhagen',
      street: 'Amagerbrogade',
      buildingNumber: 4,
      postalCode: '2300',
    });

    geocodingService.geocodeAddress = jest
      .fn()
      .mockReturnValueOnce([1000, 1000]);
    geocodingService.geocodeAddress = jest.fn().mockReturnValueOnce([1, 1]);

    return addressDto;
  }

  async function createMinimumAmountOfDriversToNotFailAssignment() {
    const minimumDriversAwaitingToStopLoop = 4;
    for (let i = 0; i < minimumDriversAwaitingToStopLoop; i++) {
      await createNearbyDriver(`WU121${i}`);
    }
  }
});
