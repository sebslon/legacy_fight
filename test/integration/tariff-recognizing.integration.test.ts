import { Test, TestingModule } from '@nestjs/testing';
import { getConnection } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { TransitController } from '../../src/ride/transit.controller';
import { Fixtures } from '../common/fixtures';

describe('Tariff recognizing', () => {
  let transitController: TransitController;
  let fixtures: Fixtures;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    transitController = module.get<TransitController>(TransitController);

    fixtures = module.get<Fixtures>(Fixtures);
  });

  afterAll(async () => {
    await getConnection().close();
  });

  it('Displays New Years Eve Tariff', async () => {
    const transit = await fixtures.createCompletedTransitAt(
      60,
      new Date('2023-12-31 08:00'),
    );

    const transitDTO = await transitController.getTransit(
      transit.getRequestUUID(),
    );

    expect(transitDTO.getTariff()).toBe('Sylwester');
    expect(transitDTO.getKmRate()).toBe(3.5);
  });

  it('Displays Weekend Tariff during the weekend', async () => {
    const transit = await fixtures.createCompletedTransitAt(
      60,
      new Date('2023-12-23 08:00'),
    );

    const transitDTO = await transitController.getTransit(
      transit.getRequestUUID(),
    );

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

    const transitDTO = await transitController.getTransit(
      transit.getRequestUUID(),
    );
    const transitDTO2 = await transitController.getTransit(
      transit2.getRequestUUID(),
    );

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

    const transitDTO = await transitController.getTransit(
      transit.getRequestUUID(),
    );

    expect(transitDTO.getTariff()).toBe('Standard');
    expect(transitDTO.getKmRate()).toBe(1.0);
  });

  it('Displays Standard Tariff before 2019', async () => {
    const transit = await fixtures.createCompletedTransitAt(
      60,
      new Date('2018-12-20 08:00'),
    );

    const transitDTO = await transitController.getTransit(
      transit.getRequestUUID(),
    );

    expect(transitDTO.getTariff()).toBe('Standard');
    expect(transitDTO.getKmRate()).toBe(1.0);
  });
});
