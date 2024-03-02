import { Test, TestingModule } from '@nestjs/testing';
import { NEO4J_DRIVER } from '@nhogs/nestjs-neo4j';
import { Driver } from 'neo4j-driver-core';

import { AppModule } from '../../../src/app.module';
import { GraphTransitAnalyzer } from '../../../src/transit-analyzer/graph-transit-analyzer';

describe.skip('Graph Transit Analyzer', () => {
  let graphTransitAnalyzer: GraphTransitAnalyzer;
  let neo4jDriver: Driver;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    graphTransitAnalyzer =
      module.get<GraphTransitAnalyzer>(GraphTransitAnalyzer);
    neo4jDriver = module.get<Driver>(NEO4J_DRIVER);
  });

  afterAll(async () => {
    await neo4jDriver.close();
  });

  it('Can recocgnize new address', async () => {
    await graphTransitAnalyzer.addTransitBetweenAddresses(
      'client-id-1',
      'transit-id-1',
      '111',
      '222',
      new Date('2021-01-01T00:00:00Z'),
      new Date('2021-01-01T00:10:00Z'),
    );
    await graphTransitAnalyzer.addTransitBetweenAddresses(
      'client-id-1',
      'transit-id-1',
      '222',
      '333',
      new Date('2021-01-01T00:12:00Z'),
      new Date('2021-01-01T00:22:00Z'),
    );
    await graphTransitAnalyzer.addTransitBetweenAddresses(
      'client-id-1',
      'transit-id-1',
      '333',
      '444',
      new Date('2021-01-01T00:24:00Z'),
      new Date('2021-01-01T00:34:00Z'),
    );

    //when
    const result = await graphTransitAnalyzer.analyze('1', '111');

    console.log(result);

    //then
    expect(result).toEqual(['111', '222', '333', '444']);
  });
});
