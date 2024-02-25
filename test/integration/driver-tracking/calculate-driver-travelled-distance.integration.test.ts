import { Test, TestingModule } from '@nestjs/testing';
import { getConnection } from 'typeorm';

import { AppModule } from '../../../src/app.module';
import { Clock } from '../../../src/common/clock';
import { TravelledDistanceService } from '../../../src/driver-report/travelled-distance/travelled-distance.service';
import { AddressRepository } from '../../../src/repository/address.repository';
import { ClientRepository } from '../../../src/repository/client.repository';
import { DriverAttributeRepository } from '../../../src/repository/driver-attribute.repository';
import { DriverFeeRepository } from '../../../src/repository/driver-fee.repository';
import { TransitRepository } from '../../../src/repository/transit.repository';
import { AwardsService } from '../../../src/service/awards.service';
import { CarTypeService } from '../../../src/service/car-type.service';
import { ClaimService } from '../../../src/service/claim.service';
import { DriverSessionService } from '../../../src/service/driver-session.service';
import { DriverTrackingService } from '../../../src/service/driver-tracking.service';
import { DriverService } from '../../../src/service/driver.service';
import { TransitService } from '../../../src/service/transit.service';
import { Fixtures } from '../../common/fixtures';

describe('Calculate Driver Travelled Distance', () => {
  const NOON = new Date('2020-01-01T12:00:00Z').getTime();
  const NOON_FIVE = NOON + 5 * 60 * 1000;
  const NOON_TEN = NOON + 10 * 60 * 1000;

  let fixtures: Fixtures;

  let travelledDistanceService: TravelledDistanceService;
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
      {} as TransitService,
      {} as DriverSessionService,
      {} as DriverTrackingService,
    );

    travelledDistanceService = module.get<TravelledDistanceService>(
      TravelledDistanceService,
    );
  });

  afterAll(async () => {
    await getConnection().close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Distance is zero when zero positions', async () => {
    const driver = await fixtures.createTestDriver();
    const distance = await travelledDistanceService.calculateDistance(
      driver.getId(),
      new Date(NOON),
      new Date(NOON_FIVE),
    );

    expect(distance.toString('km')).toBe('0km');
  });

  it('Travelled distance without multiple positions is zero', async () => {
    const driver = await fixtures.createTestDriver();

    itIsNoon();

    await travelledDistanceService.addPosition(
      driver.getId(),
      53.32055,
      -1.7297,
      new Date(NOON),
    );
    const distance = await travelledDistanceService.calculateDistance(
      driver.getId(),
      new Date(NOON),
      new Date(NOON_FIVE),
    );

    expect(distance.toString('km')).toBe('0km');
  });

  it('Can calculate travelled distance from short transit', async () => {
    const driver = await fixtures.createTestDriver();

    itIsNoon();

    await travelledDistanceService.addPosition(
      driver.getId(),
      53.3205,
      -1.7297,
      new Date(NOON),
    );
    await travelledDistanceService.addPosition(
      driver.getId(),
      53.3186,
      -1.6997,
      new Date(NOON),
    );
    await travelledDistanceService.addPosition(
      driver.getId(),
      53.3205,
      -1.7297,
      new Date(NOON),
    );

    const distance = await travelledDistanceService.calculateDistance(
      driver.getId(),
      new Date(NOON),
      new Date(NOON_FIVE),
    );

    expect(distance.toString('km')).toBe('4.008km');
  });

  it('Can calculate travelled distance with break within', async () => {
    const driver = await fixtures.createTestDriver();

    itIsNoon();

    await travelledDistanceService.addPosition(
      driver.getId(),
      53.32,
      -1.7297,
      new Date(NOON),
    );
    await travelledDistanceService.addPosition(
      driver.getId(),
      53.3186,
      -1.6997,
      new Date(NOON),
    );
    await travelledDistanceService.addPosition(
      driver.getId(),
      53.32,
      -1.7297,
      new Date(NOON),
    );

    itIsNoonFive();

    await travelledDistanceService.addPosition(
      driver.getId(),
      53.32,
      -1.7297,
      new Date(NOON_FIVE),
    );
    await travelledDistanceService.addPosition(
      driver.getId(),
      53.3186,
      -1.6997,
      new Date(NOON_FIVE),
    );
    await travelledDistanceService.addPosition(
      driver.getId(),
      53.32,
      -1.7297,
      new Date(NOON_FIVE),
    );

    const distance = await travelledDistanceService.calculateDistance(
      driver.getId(),
      new Date(NOON),
      new Date(NOON_FIVE),
    );

    expect(distance.toString('km')).toBe('7.995km');
  });

  it('Can calculate travelled distance with multiple breaks', async () => {
    const driver = await fixtures.createTestDriver();

    itIsNoon();

    await travelledDistanceService.addPosition(
      driver.getId(),
      53.32,
      -1.729,
      new Date(NOON),
    );
    await travelledDistanceService.addPosition(
      driver.getId(),
      53.318,
      -1.699,
      new Date(NOON),
    );
    await travelledDistanceService.addPosition(
      driver.getId(),
      53.32,
      -1.729,
      new Date(NOON),
    );

    itIsNoonFive();

    await travelledDistanceService.addPosition(
      driver.getId(),
      53.32,
      -1.729,
      new Date(NOON_FIVE),
    );
    await travelledDistanceService.addPosition(
      driver.getId(),
      53.318,
      -1.699,
      new Date(NOON_FIVE),
    );
    await travelledDistanceService.addPosition(
      driver.getId(),
      53.32,
      -1.729,
      new Date(NOON_FIVE),
    );

    itIsNoonTen();

    await travelledDistanceService.addPosition(
      driver.getId(),
      53.32,
      -1.729,
      new Date(NOON_TEN),
    );
    await travelledDistanceService.addPosition(
      driver.getId(),
      53.318,
      -1.699,
      new Date(NOON_TEN),
    );
    await travelledDistanceService.addPosition(
      driver.getId(),
      53.32,
      -1.729,
      new Date(NOON_TEN),
    );

    const distance = await travelledDistanceService.calculateDistance(
      driver.getId(),
      new Date(NOON),
      new Date(NOON_TEN),
    );

    expect(distance.toString('km')).toBe('12.03km');
  });

  // Helper Functions

  function itIsNoon() {
    jest.spyOn(Clock, 'currentDate').mockReturnValue(new Date(NOON));
  }

  function itIsNoonFive() {
    jest.spyOn(Clock, 'currentDate').mockReturnValue(new Date(NOON_FIVE));
  }

  function itIsNoonTen() {
    jest.spyOn(Clock, 'currentDate').mockReturnValue(new Date(NOON_TEN));
  }
});
