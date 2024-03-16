import { DynamicModule, Module, OnModuleDestroy } from '@nestjs/common';
import {
  createDriver,
  Neo4jConfig,
  Neo4jService,
  NEO4J_CONFIG,
  NEO4J_DRIVER,
} from '@nhogs/nestjs-neo4j';

@Module({})
export class Neo4jModule implements OnModuleDestroy {
  constructor(private readonly neo4jService: Neo4jService) {}

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

  public async onModuleDestroy() {
    await this.neo4jService.onApplicationShutdown();
  }
}
