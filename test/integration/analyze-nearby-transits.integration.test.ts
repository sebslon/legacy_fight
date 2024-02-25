import { Test, TestingModule } from '@nestjs/testing';
import { getConnection } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { TransitAnalyzerController } from '../../src/controllers/transit-analyzer.controller';
import { Address } from '../../src/entity/address.entity';
import { CarClass } from '../../src/entity/car-type.entity';
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

describe('Analyze Nearby Transits', () => {
  let fixtures: Fixtures;

  let driverService: DriverService;
  let driverFeeRepository: DriverFeeRepository;
  let transitRepository: TransitRepository;
  let addressRepository: AddressRepository;
  let clientRepository: ClientRepository;
  let carTypeService: CarTypeService;
  let claimService: ClaimService;
  let awardsService: AwardsService;
  let driverAttributeRepository: DriverAttributeRepository;
  let geocodingService: GeocodingService;
  let driverSessionService: DriverSessionService;
  let driverTrackingService: DriverTrackingService;
  let transitService: TransitService;
  let transitAnalyzerController: TransitAnalyzerController;

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
    geocodingService = module.get<GeocodingService>(GeocodingService);
    driverAttributeRepository = module.get<DriverAttributeRepository>(
      DriverAttributeRepository,
    );
    driverSessionService =
      module.get<DriverSessionService>(DriverSessionService);
    driverTrackingService = module.get<DriverTrackingService>(
      DriverTrackingService,
    );
    transitService = module.get<TransitService>(TransitService);
    transitAnalyzerController = module.get<TransitAnalyzerController>(
      TransitAnalyzerController,
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
      transitService,
      driverSessionService,
      driverTrackingService,
    );

    driverTrackingService = module.get<DriverTrackingService>(
      DriverTrackingService,
    );
  });

  afterAll(async () => {
    await getConnection().close();
  });

  beforeEach(async () => {
    await fixtures.createActiveCarCategory(CarClass.VAN);
    jest.spyOn(geocodingService, 'geocodeAddress').mockReturnValue([1, 1]);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('Can find longest travel', async () => {
    const client = await fixtures.createTestClient();

    // GIVEN
    const driver = await fixtures.createNearbyDriver('WA001');

    const address1 = new Address('1_1', '1', '1', '1', 1);
    const address2 = new Address('1_2', '2', '2', '2', 2);
    const address3 = new Address('1_3', '3', '3', '3', 3);
    const address4 = new Address('1_4', '4', '4', '4', 4);
    const address5 = new Address('1_5', '5', '5', '5', 5);

    // AND - travels
    // 1-2-3-4
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-01-01T12:00:00Z'),
      new Date('2021-01-01T12:10:00Z'),
      client,
      driver,
      address1,
      address2,
    );
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-01-01T12:15:00Z'),
      new Date('2021-01-01T12:20:00Z'),
      client,
      driver,
      address2,
      address3,
    );
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-01-01T12:25:00Z'),
      new Date('2021-01-01T12:30:00Z'),
      client,
      driver,
      address3,
      address4,
    );

    // 1-2-3
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-01-02T12:00:00Z'),
      new Date('2021-01-02T12:10:00Z'),
      client,
      driver,
      address1,
      address2,
    );
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-01-02T12:15:00Z'),
      new Date('2021-01-02T12:20:00Z'),
      client,
      driver,
      address2,
      address3,
    );

    // 1-3
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-01-03T12:00:00Z'),
      new Date('2021-01-03T12:10:00Z'),
      client,
      driver,
      address1,
      address3,
    );

    // 3-1-2-5-4-5
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-01-04T12:00:00Z'),
      new Date('2021-01-04T12:10:00Z'),
      client,
      driver,
      address3,
      address1,
    );
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-01-04T12:20:00Z'),
      new Date('2021-01-04T12:25:00Z'),
      client,
      driver,
      address1,
      address2,
    );
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-01-04T12:30:00Z'),
      new Date('2021-01-04T12:35:00Z'),
      client,
      driver,
      address2,
      address5,
    );
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-01-04T12:40:00Z'),
      new Date('2021-01-04T12:45:00Z'),
      client,
      driver,
      address5,
      address4,
    );
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-01-04T12:50:00Z'),
      new Date('2021-01-04T12:55:00Z'),
      client,
      driver,
      address4,
      address5,
    );

    // WHEN
    const savedAddress1 = await addressRepository.findByHashOrFail(
      address1.getHash(),
    );

    const analyzedAddressesDTO = await transitAnalyzerController.analyze(
      client.getId(),
      savedAddress1.getId(),
    );

    // THEN
    // 1-2-5-4-5
    expect(analyzedAddressesDTO.getAddresses().map((a) => a.getHash())).toEqual(
      [address1, address2, address5, address4, address5].map((a) =>
        a.getHash(),
      ),
    );
  });

  it('Can find longest travel from multiple clients', async () => {
    // GIVEN
    const client1 = await fixtures.createTestClient();
    const client2 = await fixtures.createTestClient();
    const client3 = await fixtures.createTestClient();
    const client4 = await fixtures.createTestClient();

    const driver = await fixtures.createNearbyDriver('WA001');

    const address1 = new Address('2_1', '1', '1', '1', 1);
    const address2 = new Address('2_2', '2', '2', '2', 2);
    const address3 = new Address('2_3', '3', '3', '3', 3);
    const address4 = new Address('2_4', '4', '4', '4', 4);
    const address5 = new Address('2_5', '5', '5', '5', 5);

    // AND - travels
    // CLIENT 1 - 1-2-3-4
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-01-01T12:00:00Z'),
      new Date('2021-01-01T12:10:00Z'),
      client1,
      driver,
      address1,
      address2,
    );
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-01-01T12:15:00Z'),
      new Date('2021-01-01T12:20:00Z'),
      client1,
      driver,
      address2,
      address3,
    );
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-01-01T12:25:00Z'),
      new Date('2021-01-01T12:30:00Z'),
      client1,
      driver,
      address3,
      address4,
    );

    // CLIENT 2 - 1-2-3
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-01-02T12:00:00Z'),
      new Date('2021-01-01T12:10:00Z'),
      client2,
      driver,
      address1,
      address2,
    );
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-01-02T12:15:00Z'),
      new Date('2021-01-01T12:20:00Z'),
      client2,
      driver,
      address2,
      address3,
    );

    // CLIENT 3 - 1-3
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-01-03T12:00:00Z'),
      new Date('2021-01-01T12:10:00Z'),
      client3,
      driver,
      address1,
      address3,
    );

    // CLIENT 4 - 1-3-2-5-4-5
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-02-01T12:00:00Z'),
      new Date('2021-02-01T12:10:00Z'),
      client4,
      driver,
      address1,
      address3,
    );
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-02-01T12:20:00Z'),
      new Date('2021-02-01T12:25:00Z'),
      client4,
      driver,
      address3,
      address2,
    );
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-02-01T12:30:00Z'),
      new Date('2021-02-01T12:35:00Z'),
      client4,
      driver,
      address2,
      address5,
    );
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-02-01T12:40:00Z'),
      new Date('2021-02-01T12:45:00Z'),
      client4,
      driver,
      address5,
      address4,
    );
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-02-01T12:50:00Z'),
      new Date('2021-02-01T12:55:00Z'),
      client4,
      driver,
      address4,
      address5,
    );

    // WHEN
    const savedAddress1 = await addressRepository.findByHashOrFail(
      address1.getHash(),
    );
    const analyzedAddressesDTO = await transitAnalyzerController.analyze(
      client1.getId(),
      savedAddress1.getId(),
    );

    // THEN
    // 1-2-3-4
    expect(analyzedAddressesDTO.getAddresses().map((a) => a.getHash())).toEqual(
      [address1, address2, address3, address4].map((a) => a.getHash()),
    );
  });

  it('Can find longest travel with long stop', async () => {
    // GIVEN
    const client = await fixtures.createTestClient();

    const driver = await fixtures.createNearbyDriver('WA001');

    const address1 = new Address('3_1', '1', '1', '1', 1);
    const address2 = new Address('3_2', '2', '2', '2', 2);
    const address3 = new Address('3_3', '3', '3', '3', 3);
    const address4 = new Address('3_4', '4', '4', '4', 4);
    const address5 = new Address('3_5', '5', '5', '5', 5);

    // AND - travels
    // 1-2-3-4-(stop)-5-1
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-01-01T12:00:00Z'),
      new Date('2021-01-01T12:05:00Z'),
      client,
      driver,
      address1,
      address2,
    );
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-01-01T12:10:00Z'),
      new Date('2021-01-01T12:15:00Z'),
      client,
      driver,
      address2,
      address3,
    );
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-01-01T12:20:00Z'),
      new Date('2021-01-01T12:25:00Z'),
      client,
      driver,
      address3,
      address4,
    );
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-01-01T13:00:00Z'),
      new Date('2021-01-01T13:10:00Z'),
      client,
      driver,
      address4,
      address5,
    );
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-01-01T13:10:00Z'),
      new Date('2021-01-01T13:15:00Z'),
      client,
      driver,
      address5,
      address1,
    );

    // WHEN
    const savedAddress1 = await addressRepository.findByHashOrFail(
      address1.getHash(),
    );
    const analyzedAddressesDTO = await transitAnalyzerController.analyze(
      client.getId(),
      savedAddress1.getId(),
    );

    // THEN
    // 1-2-3-4
    expect(analyzedAddressesDTO.getAddresses().map((a) => a.getHash())).toEqual(
      [address1, address2, address3, address4].map((a) => a.getHash()),
    );
  });

  it('Can find longest travel with loops', async () => {
    // GIVEN
    const client = await fixtures.createTestClient();

    const driver = await fixtures.createNearbyDriver('WA001');

    const address1 = new Address('4_1', '1', '1', '1', 1);
    const address2 = new Address('4_2', '2', '2', '2', 2);
    const address3 = new Address('4_3', '3', '3', '3', 3);
    const address4 = new Address('4_4', '4', '4', '4', 4);
    const address5 = new Address('4_5', '5', '5', '5', 5);

    // AND - travels
    // 5-1-2-3
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-01-01T12:00:00Z'),
      new Date('2021-01-01T12:05:00Z'),
      client,
      driver,
      address5,
      address1,
    );
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-01-01T12:06:00Z'),
      new Date('2021-01-01T12:10:00Z'),
      client,
      driver,
      address1,
      address2,
    );
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-01-01T12:15:00Z'),
      new Date('2021-01-01T12:20:00Z'),
      client,
      driver,
      address2,
      address3,
    );

    // 3-2-1
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-01-02T12:00:00Z'),
      new Date('2021-01-02T12:10:00Z'),
      client,
      driver,
      address3,
      address2,
    );
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-01-02T12:15:00Z'),
      new Date('2021-01-02T12:20:00Z'),
      client,
      driver,
      address2,
      address1,
    );

    // 1-5
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-01-03T12:00:00Z'),
      new Date('2021-01-03T12:10:00Z'),
      client,
      driver,
      address1,
      address5,
    );

    // 3-1-2-5-4-5
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-02-01T12:00:00Z'),
      new Date('2021-02-01T12:10:00Z'),
      client,
      driver,
      address3,
      address1,
    );
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-02-01T12:20:00Z'),
      new Date('2021-02-01T12:25:00Z'),
      client,
      driver,
      address1,
      address2,
    );
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-02-01T12:30:00Z'),
      new Date('2021-02-01T12:35:00Z'),
      client,
      driver,
      address2,
      address5,
    );
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-02-01T12:40:00Z'),
      new Date('2021-02-01T12:45:00Z'),
      client,
      driver,
      address5,
      address4,
    );
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-02-01T12:50:00Z'),
      new Date('2021-02-01T12:55:00Z'),
      client,
      driver,
      address4,
      address5,
    );

    // WHEN
    const savedAddress5 = await addressRepository.findByHashOrFail(
      address5.getHash(),
    );
    const analyzedAddressesDTO = await transitAnalyzerController.analyze(
      client.getId(),
      savedAddress5.getId(),
    );

    // THEN
    // 5-1-2-3
    console.log(analyzedAddressesDTO.getAddresses().map((a) => a.getCountry()));

    expect(analyzedAddressesDTO.getAddresses().map((a) => a.getHash())).toEqual(
      [address5, address1, address2, address3].map((a) => a.getHash()),
    );
  });

  it('Can find long travel between others', async () => {
    // GIVEN
    const client = await fixtures.createTestClient();

    const driver = await fixtures.createNearbyDriver('WA001');

    const address1 = new Address('5_1', '1', '1', '1', 1);
    const address2 = new Address('5_2', '2', '2', '2', 2);
    const address3 = new Address('5_3', '3', '3', '3', 3);
    const address4 = new Address('5_4', '4', '4', '4', 4);
    const address5 = new Address('5_5', '5', '5', '5', 5);

    // AND - travels
    // 1-2-3
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-01-01T12:00:00Z'),
      new Date('2021-01-01T12:05:00Z'),
      client,
      driver,
      address1,
      address2,
    );
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-01-01T12:10:00Z'),
      new Date('2021-01-01T12:15:00Z'),
      client,
      driver,
      address2,
      address3,
    );

    // 4-5
    await fixtures.aRequestedAndCompletedTransit(
      50,
      new Date('2021-01-01T12:20:00Z'),
      new Date('2021-01-01T12:25:00Z'),
      client,
      driver,
      address4,
      address5,
    );

    // WHEN
    const savedAddress1 = await addressRepository.findByHashOrFail(
      address1.getHash(),
    );
    const analyzedAddressesDTO = await transitAnalyzerController.analyze(
      client.getId(),
      savedAddress1.getId(),
    );

    // THEN
    // 1-2-3
    expect(analyzedAddressesDTO.getAddresses().map((a) => a.getHash())).toEqual(
      [address1, address2, address3].map((a) => a.getHash()),
    );
  });
});
