import { Injectable, Logger } from '@nestjs/common';
import { Neo4jService } from '@nhogs/nestjs-neo4j';

@Injectable()
export class GraphTransitAnalyzer {
  constructor(private readonly neo4jService: Neo4jService) {}

  public async analyze(
    clientId: string,
    addressHash: string,
  ): Promise<string[]> {
    try {
      const result = await this.neo4jService.run({
        cypher: `
          MATCH p=(a:Address)-[:Transit*]->(:Address) 
          WHERE a.hash = $addressHash
          AND (ALL(x IN range(1, length(p)-1) WHERE ((relationships(p)[x]).clientId = $clientId) AND 0 <= duration.inSeconds( (relationships(p)[x-1]).completeAt, (relationships(p)[x]).started).minutes <= 15)) 
          AND length(p) >= 1
          RETURN [x in nodes(p) | x.hash] AS hashes ORDER BY length(p) DESC LIMIT 1
        `,
        parameters: { clientId, addressHash },
      });

      return result.records.map((record) => record.get('hashes')).flat();
    } catch (e) {
      Logger.error(e);
      Logger.error('Error while analyzing transit');
      return [];
    }
  }

  public async addTransitBetweenAddresses(
    clientId: string,
    transitId: string,
    addressFromHash: string,
    addressToHash: string,
    started: Date,
    completedAt: Date,
  ) {
    await this.neo4jService.run(
      {
        cypher: 'MERGE (from:Address {hash: $addressFromHash})',
        parameters: { addressFromHash },
      },
      { write: true },
    );

    await this.neo4jService.run(
      {
        cypher: 'MERGE (to:Address {hash: $addressToHash})',
        parameters: { addressToHash },
      },
      {
        write: true,
      },
    );

    await this.neo4jService.run(
      {
        cypher: `
          MATCH (from:Address {hash: $addressFromHash}), (to:Address {hash: $addressToHash}) 
          CREATE (from)-[:Transit {clientId: $clientId, transitId: $transitId, started: datetime($started), completeAt: datetime($completeAt)}]->(to)
        `,
        parameters: {
          clientId,
          transitId,
          addressFromHash,
          addressToHash,
          started: started.toISOString(),
          completeAt: completedAt.toISOString(),
        },
      },
      {
        write: true,
      },
    );
  }
}
