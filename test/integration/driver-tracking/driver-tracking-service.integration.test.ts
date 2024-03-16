import { Test, TestingModule } from '@nestjs/testing';
import { getConnection } from 'typeorm';

import { AppModule } from '../../../src/app.module';
import { Clock } from '../../../src/common/clock';
import { DriverTrackingService } from '../../../src/service/driver-tracking.service';
import { Fixtures } from '../../common/fixtures';

describe('Driver Tracking Service', () => {
  const NOON = new Date('2020-01-01T12:00:00Z').getTime();
  const NOON_FIVE = NOON + 5 * 60 * 1000;

  let fixtures: Fixtures;
  let driverTrackingService: DriverTrackingService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    driverTrackingService = module.get<DriverTrackingService>(
      DriverTrackingService,
    );

    fixtures = module.get<Fixtures>(Fixtures);
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
