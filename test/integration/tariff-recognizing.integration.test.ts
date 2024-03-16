import { Test, TestingModule } from '@nestjs/testing';
import { getConnection } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { TransitController } from '../../src/controllers/transit.controller';
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
import { TransitService } from '../../src/service/transit.service';
import { TransitDetailsFacade } from '../../src/transit-details/transit-details.facade';
import { Fixtures } from '../common/fixtures';

describe('Tariff recognizing', () => {
  let driverService: DriverService;
  let transitRepository: TransitRepository;
  let driverFeeRepository: DriverFeeRepository;
  let addressRepository: AddressRepository;
  let clientRepository: ClientRepository;
  let transitController: TransitController;
  let transitDetailsFacade: TransitDetailsFacade;
  let transitService: TransitService;
  let fixtures: Fixtures;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    transitController = module.get<TransitController>(TransitController);
    driverService = module.get<DriverService>(DriverService);
    transitRepository = module.get<TransitRepository>(TransitRepository);
    driverFeeRepository = module.get<DriverFeeRepository>(DriverFeeRepository);
    addressRepository = module.get<AddressRepository>(AddressRepository);
    clientRepository = module.get<ClientRepository>(ClientRepository);
    transitDetailsFacade =
      module.get<TransitDetailsFacade>(TransitDetailsFacade);
    transitService = module.get<TransitService>(TransitService);

    fixtures = new Fixtures(
      transitDetailsFacade,
      driverService,
      driverFeeRepository,
      transitRepository,
      addressRepository,
      clientRepository,
      {} as CarTypeService,
      {} as ClaimService,
      {} as AwardsService,
      {} as DriverAttributeRepository,
      transitService,
      {} as DriverSessionService,
      {} as DriverTrackingService,
    );
  });

  afterAll(async () => {
    await getConnection().close();
  });

  it('Displays New Years Eve Tariff', async () => {
    const transit = await fixtures.createCompletedTransitAt(
      60,
      new Date('2023-12-31 08:00'),
    );

    const transitDTO = await transitController.getTransit(transit.getId());

    expect(transitDTO.getTariff()).toBe('Sylwester');
    expect(transitDTO.getKmRate()).toBe(3.5);
  });

  it('Displays Weekend Tariff during the weekend', async () => {
    const transit = await fixtures.createCompletedTransitAt(
      60,
      new Date('2023-12-23 08:00'),
    );

    const transitDTO = await transitController.getTransit(transit.getId());

    expect(transitDTO.getTariff()).toBe('Weekend');
    expect(transitDTO.getKmRate()).toBe(1.5);
  });

  it('Displays Weekend+ Tariff in relevant hours', async () => {
    const transit = await fixtures.createCompletedTransitAt(
      60,
      new Date('2023-12-23 18:00'),
    );
    const transit2 = await fixtures.createCompletedTransitAt(
      60,
      new Date('2023-12-24 05:00'),
    );

    const transitDTO = await transitController.getTransit(transit.getId());
    const transitDTO2 = await transitController.getTransit(transit2.getId());

    expect(transitDTO.getTariff()).toBe('Weekend+');
    expect(transitDTO.getKmRate()).toBe(2.5);
    expect(transitDTO2.getTariff()).toBe('Weekend+');
    expect(transitDTO2.getKmRate()).toBe(2.5);
  });

  it('Displays Standard Tariff during the week', async () => {
    const transit = await fixtures.createCompletedTransitAt(
      60,
      new Date('2023-12-20 08:00'),
    );

    const transitDTO = await transitController.getTransit(transit.getId());

    expect(transitDTO.getTariff()).toBe('Standard');
    expect(transitDTO.getKmRate()).toBe(1.0);
  });

  it('Displays Standard Tariff before 2019', async () => {
    const transit = await fixtures.createCompletedTransitAt(
      60,
      new Date('2018-12-20 08:00'),
    );

    const transitDTO = await transitController.getTransit(transit.getId());

    expect(transitDTO.getTariff()).toBe('Standard');
    expect(transitDTO.getKmRate()).toBe(1.0);
  });
});
