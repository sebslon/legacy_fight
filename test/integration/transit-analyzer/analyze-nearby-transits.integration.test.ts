import { Test, TestingModule } from '@nestjs/testing';
import { Neo4jService } from '@nhogs/nestjs-neo4j';
import { getConnection } from 'typeorm';

import { AppModule } from '../../../src/app.module';
import { Address } from '../../../src/entity/address.entity';
import { CarClass } from '../../../src/car-fleet/car-class.enum';
import { AddressRepository } from '../../../src/repository/address.repository';
import { GeocodingService } from '../../../src/service/geocoding.service';
import { TransitAnalyzerController } from '../../../src/transit-analyzer/transit-analyzer.controller';
import { Fixtures } from '../../common/fixtures';

describe('Analyze Nearby Transits', () => {
  let fixtures: Fixtures;

  let addressRepository: AddressRepository;
  let geocodingService: GeocodingService;
  let transitAnalyzerController: TransitAnalyzerController;
  let neo4jService: Neo4jService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await module.init();

    addressRepository = module.get<AddressRepository>(AddressRepository);
    geocodingService = module.get<GeocodingService>(GeocodingService);
    transitAnalyzerController = module.get<TransitAnalyzerController>(
      TransitAnalyzerController,
    );

    neo4jService = module.get<Neo4jService>(Neo4jService);
    fixtures = module.get<Fixtures>(Fixtures);
  });

  afterAll(async () => {
    await getConnection().close();
  });

  beforeEach(async () => {
    jest.spyOn(geocodingService, 'geocodeAddress').mockReturnValue([1, 1]);
    await fixtures.createActiveCarCategory(CarClass.VAN);
    await cleanupDriverPositions();
    await neo4jService.run(
      {
        cypher: 'MATCH (n) DETACH DELETE n',
      },
      { write: true },
    );
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

  function cleanupDriverPositions() {
    return getConnection().query(`
      TRUNCATE TABLE driver_position CASCADE;
    `);
  }
});
