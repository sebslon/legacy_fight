import { Test, TestingModule } from '@nestjs/testing';
import { getConnection } from 'typeorm';

import { AppModule } from '../../../src/app.module';
import { Clock } from '../../../src/common/clock';
import { AddressRepository } from '../../../src/repository/address.repository';
import { ClientRepository } from '../../../src/repository/client.repository';
import { DriverAttributeRepository } from '../../../src/repository/driver-attribute.repository';
import { DriverFeeRepository } from '../../../src/repository/driver-fee.repository';
import { TransitRepository } from '../../../src/repository/transit.repository';
import { AwardsService } from '../../../src/service/awards.service';
import { CarTypeService } from '../../../src/service/car-type.service';
import { ClaimService } from '../../../src/service/claim.service';
import { DriverTrackingService } from '../../../src/service/driver-tracking.service';
import { DriverService } from '../../../src/service/driver.service';
import { Fixtures } from '../../common/fixtures';

describe('Driver Tracking Service', () => {
  const NOON = new Date('2020-01-01T12:00:00Z').getTime();
  const NOON_FIVE = NOON + 5 * 60 * 1000;

  let fixtures: Fixtures;

  let driverTrackingService: DriverTrackingService;
  let driverService: DriverService;
  let driverFeeRepository: DriverFeeRepository;
  let transitRepository: TransitRepository;
  let addressRepository: AddressRepository;
  let clientRepository: ClientRepository;
  let carTypeService: CarTypeService;
  let claimService: ClaimService;
  let awardsService: AwardsService;
  let driverAttributeRepository: DriverAttributeRepository;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    driverService = module.get<DriverService>(DriverService);
    driverFeeRepository = module.get<DriverFeeRepository>(DriverFeeRepository);
    transitRepository = module.get<TransitRepository>(TransitRepository);
    addressRepository = module.get<AddressRepository>(AddressRepository);
    clientRepository = module.get<ClientRepository>(ClientRepository);
    carTypeService = module.get<CarTypeService>(CarTypeService);
    claimService = module.get<ClaimService>(ClaimService);
    awardsService = module.get<AwardsService>(AwardsService);
    driverAttributeRepository = module.get<DriverAttributeRepository>(
      DriverAttributeRepository,
    );

    fixtures = new Fixtures(
      driverService,
      driverFeeRepository,
      transitRepository,
      addressRepository,
      clientRepository,
      carTypeService,
      claimService,
      awardsService,
      driverAttributeRepository,
    );

    driverTrackingService = module.get<DriverTrackingService>(
      DriverTrackingService,
    );
  });

  afterAll(async () => {
    await getConnection().close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Can calculate travelled distance from short transit', async () => {
    const driver = await fixtures.createTestDriver();

    itIsNoon();

    await driverTrackingService.registerPosition(
      driver.getId(),
      53.3205,
      -1.7297,
      new Date(NOON),
    );
    await driverTrackingService.registerPosition(
      driver.getId(),
      53.3186,
      -1.6997,
      new Date(NOON),
    );
    await driverTrackingService.registerPosition(
      driver.getId(),
      53.3205,
      -1.7297,
      new Date(NOON),
    );

    const distance = await driverTrackingService.calculateTravelledDistance(
      driver.getId(),
      NOON,
      NOON_FIVE,
    );

    expect(distance.toString('km')).toBe('4.008km');
  });

  function itIsNoon() {
    jest.spyOn(Clock, 'currentDate').mockReturnValue(new Date(NOON));
  }
});
