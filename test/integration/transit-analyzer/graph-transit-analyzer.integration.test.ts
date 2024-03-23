import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '../../../src/app.module';
import { GraphTransitAnalyzer } from '../../../src/crm/transit-analyzer/graph-transit-analyzer';

describe('Graph Transit Analyzer', () => {
  let graphTransitAnalyzer: GraphTransitAnalyzer;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    graphTransitAnalyzer =
      module.get<GraphTransitAnalyzer>(GraphTransitAnalyzer);
  });

  it('Can recocgnize new address', async () => {
    await graphTransitAnalyzer.addTransitBetweenAddresses(
      '1',
      '1',
      '111',
      '222',
      new Date(),
      new Date(),
    );
    await graphTransitAnalyzer.addTransitBetweenAddresses(
      '1',
      '1',
      '222',
      '333',
      new Date(),
      new Date(),
    );
    await graphTransitAnalyzer.addTransitBetweenAddresses(
      '1',
      '1',
      '333',
      '444',
      new Date(),
      new Date(),
    );

    //when
    const result = await graphTransitAnalyzer.analyze('1', '111');

    expect(result).toEqual(['111', '222', '333', '444']);
  });
});
