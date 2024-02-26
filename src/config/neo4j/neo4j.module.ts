import { DynamicModule, Module } from '@nestjs/common';
import {
  createDriver,
  Neo4jConfig,
  Neo4jService,
  NEO4J_CONFIG,
  NEO4J_DRIVER,
} from '@nhogs/nestjs-neo4j';

@Module({})
export class Neo4jModule {
  public static forRoot(config: Neo4jConfig): DynamicModule {
    return {
      module: Neo4jModule,
      global: config.global,
      providers: [
        {
          provide: NEO4J_CONFIG,
          useValue: config,
        },
        {
          provide: NEO4J_DRIVER,
          inject: [NEO4J_CONFIG],
          useFactory: async (config: Neo4jConfig) => createDriver(config),
        },
        Neo4jService,
      ],
      exports: [Neo4jService],
    };
  }
}
