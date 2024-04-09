import { Test, TestingModule } from '@nestjs/testing';
import { getConnection } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { CarClass } from '../../src/car-fleet/car-class.enum';
import { Clock } from '../../src/common/clock';
import { FeeType } from '../../src/driver-fleet/driver-fee.entity';
import { AddressDTO } from '../../src/geolocation/address/address.dto';
import { GeocodingService } from '../../src/geolocation/geocoding.service';
import { RideService } from '../../src/ride/ride.service';
import { TransitStatus } from '../../src/ride/transit.entity';
import { DriverPositionRepository } from '../../src/tracking/driver-position.repository';
import { DriverSessionService } from '../../src/tracking/driver-session.service';
import { DriverTrackingService } from '../../src/tracking/driver-tracking.service';
import { Fixtures } from '../common/fixtures';

describe('Transit Life Cycle', () => {
  let rideService: RideService;
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

    rideService = module.get<RideService>(RideService);
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

    const loadedTransit = await rideService.loadTransit(
      transit.getRequestUUID(),
    );

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

    await rideService.changeTransitAddressTo(
      transit.getRequestUUID(),
      new AddressDTO(newDestination),
    );

    const loadedTransit = await rideService.loadTransit(
      transit.getRequestUUID(),
    );

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

    await rideService.publishTransit(transit.getRequestUUID());
    await rideService.acceptTransit(driver, transit.getRequestUUID());
    await rideService.startTransit(driver, transit.getRequestUUID());
    await rideService.completeTransit(
      driver,
      transit.getRequestUUID(),
      destination.toAddressEntity(),
    );

    await expect(
      rideService.changeTransitAddressTo(
        transit.getRequestUUID(),
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
    const pickup = {
      country: 'Poland',
      city: 'Warsaw',
      street: 'Okopowa',
      buildingNumber: 130,
      postalCode: '00-100',
    };

    createNearbyDriver('WU1212');

    const transit = await requestTransitFromTo(
      new AddressDTO(addressData),
      new AddressDTO(addressData2),
    );

    await rideService.publishTransit(transit.getRequestUUID());

    await rideService.changeTransitAddressFrom(
      transit.getRequestUUID(),
      new AddressDTO(pickup).toAddressEntity(),
    );

    const loadedTransit = await rideService.loadTransit(
      transit.getRequestUUID(),
    );

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

    await rideService.publishTransit(transit.getRequestUUID());
    await rideService.acceptTransit(driver, transit.getRequestUUID());

    await expect(
      rideService.changeTransitAddressFrom(
        transit.getRequestUUID(),
        changedTo.toAddressEntity(),
      ),
    ).rejects.toThrow();

    await rideService.startTransit(driver, transit.getRequestUUID());

    await expect(
      rideService.changeTransitAddressFrom(
        transit.getRequestUUID(),
        changedTo.toAddressEntity(),
      ),
    ).rejects.toThrow();

    await rideService.completeTransit(
      driver,
      transit.getRequestUUID(),
      destination.toAddressEntity(),
    );

    await expect(
      rideService.changeTransitAddressFrom(
        transit.getRequestUUID(),
        changedTo.toAddressEntity(),
      ),
    ).rejects.toThrow();
  });

  it("Can't change pickup place more than three times", async () => {
    const transit = await requestTransitFromTo(
      new AddressDTO(addressData),
      new AddressDTO(addressData2),
    );

    await rideService.publishTransit(transit.getRequestUUID());

    const newAddress = new AddressDTO({
      country: 'Poland',
      city: 'Warsaw',
      street: 'Okopowa',
      buildingNumber: 130,
      postalCode: '00-100',
    });

    await rideService.changeTransitAddressFrom(
      transit.getRequestUUID(),
      newAddress.toAddressEntity(),
    );
    await rideService.changeTransitAddressFrom(
      transit.getRequestUUID(),
      newAddress.toAddressEntity(),
    );
    await rideService.changeTransitAddressFrom(
      transit.getRequestUUID(),
      newAddress.toAddressEntity(),
    );

    await expect(
      rideService.changeTransitAddressFrom(
        transit.getRequestUUID(),
        newAddress.toAddressEntity(),
      ),
    ).rejects.toThrow();
  });

  it("Can't change pickup place when it's far way from original", async () => {
    const transit = await requestTransitFromTo(
      new AddressDTO(addressData),
      new AddressDTO(addressData2),
    );

    const newAddress = farAwayAddress();

    await expect(
      rideService.changeTransitAddressFrom(
        transit.getRequestUUID(),
        newAddress.toAddressEntity(),
      ),
    ).rejects.toThrow();
  });

  it('Can cancel transit', async () => {
    const transit = await requestTransitFromTo(
      new AddressDTO(addressData),
      new AddressDTO(addressData2),
    );

    await rideService.cancelTransit(transit.getRequestUUID());

    const loadedTransit = await rideService.loadTransit(
      transit.getRequestUUID(),
    );

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

    await rideService.publishTransit(transit.getRequestUUID());
    await rideService.acceptTransit(driver, transit.getRequestUUID());
    await rideService.startTransit(driver, transit.getRequestUUID());

    await expect(
      rideService.cancelTransit(transit.getRequestUUID()),
    ).rejects.toThrow();

    await rideService.completeTransit(
      driver,
      transit.getRequestUUID(),
      destination.toAddressEntity(),
    );

    await expect(
      rideService.cancelTransit(transit.getRequestUUID()),
    ).rejects.toThrow();
  });

  it('Can publish transit', async () => {
    const transit = await requestTransitFromTo(
      new AddressDTO(addressData),
      new AddressDTO(addressData2),
    );

    await createNearbyDriver('WU1212');
    await createMinimumAmountOfDriversToNotFailAssignment();

    await rideService.publishTransit(transit.getRequestUUID());

    const loadedTransit = await rideService.loadTransit(
      transit.getRequestUUID(),
    );

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

    await rideService.publishTransit(transit.getRequestUUID());
    await rideService.acceptTransit(driver, transit.getRequestUUID());

    const loadedTransit = await rideService.loadTransit(
      transit.getRequestUUID(),
    );

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

    await rideService.publishTransit(transit.getRequestUUID());

    await rideService.acceptTransit(driver1, transit.getRequestUUID());

    await expect(
      rideService.acceptTransit(driver2, transit.getRequestUUID()),
    ).rejects.toThrow();
  });

  it("Transit can't be accepted by driver who already rejected it", async () => {
    const transit = await requestTransitFromTo(
      new AddressDTO(addressData),
      new AddressDTO(addressData2),
    );

    const driver = await createNearbyDriver('WU1212');

    await rideService.publishTransit(transit.getRequestUUID());
    await rideService.rejectTransit(driver, transit.getRequestUUID());

    await expect(
      rideService.acceptTransit(driver, transit.getRequestUUID()),
    ).rejects.toThrow();
  });

  it("Transit can't be accepted by driver who has not seen proposal", async () => {
    const transit = await requestTransitFromTo(
      new AddressDTO(addressData),
      new AddressDTO(addressData2),
    );

    const driver = await farAwayDriver('WU1212');

    await rideService.publishTransit(transit.getRequestUUID());

    await expect(
      rideService.acceptTransit(driver, transit.getRequestUUID()),
    ).rejects.toThrow();
  });

  it('Can start transit', async () => {
    const transit = await requestTransitFromTo(
      new AddressDTO(addressData),
      new AddressDTO(addressData2),
    );

    const driver = await createNearbyDriver('WU1212');

    await rideService.publishTransit(transit.getRequestUUID());
    await rideService.acceptTransit(driver, transit.getRequestUUID());
    await rideService.startTransit(driver, transit.getRequestUUID());

    const loadedTransit = await rideService.loadTransit(
      transit.getRequestUUID(),
    );

    expect(loadedTransit.getStatus()).toBe(TransitStatus.IN_TRANSIT);
    expect(loadedTransit.getStarted()).not.toBeNull();
  });

  it("Can't start not accepted transit", async () => {
    const transit = await requestTransitFromTo(
      new AddressDTO(addressData),
      new AddressDTO(addressData2),
    );

    const driver = await createNearbyDriver('WU1212');

    await rideService.publishTransit(transit.getRequestUUID());

    await expect(
      rideService.startTransit(driver, transit.getRequestUUID()),
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

    await rideService.publishTransit(transit.getRequestUUID());
    await rideService.acceptTransit(driver, transit.getRequestUUID());
    await rideService.startTransit(driver, transit.getRequestUUID());
    await rideService.completeTransit(
      driver,
      transit.getRequestUUID(),
      destination.toAddressEntity(),
    );

    const loadedTransit = await rideService.loadTransit(
      transit.getRequestUUID(),
    );

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

    await rideService.publishTransit(transit.getRequestUUID());
    await rideService.acceptTransit(driver, transit.getRequestUUID());

    await expect(
      rideService.completeTransit(
        driver,
        transit.getRequestUUID(),
        destination.toAddressEntity(),
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

    await rideService.publishTransit(transit.getRequestUUID());
    await rideService.rejectTransit(driver, transit.getRequestUUID());

    const loadedTransit = await rideService.loadTransit(
      transit.getRequestUUID(),
    );

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
    return rideService.createTransitFromDTO(
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
