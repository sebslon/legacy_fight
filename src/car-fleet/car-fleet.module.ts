import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppProperties } from '../config/app-properties.config';

import { CarTypeActiveCounter } from './car-type-active-counter.entity';
import { CarTypeController } from './car-type.controller';
import { CarType } from './car-type.entity';
import {
  CarTypeActiveCounterRepository,
  CarTypeEntityRepository,
  CarTypeRepository,
} from './car-type.repository';
import { CarTypeService } from './car-type.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CarType,
      CarTypeEntityRepository,
      CarTypeActiveCounter,
      CarTypeActiveCounterRepository,
    ]),
  ],
  controllers: [CarTypeController],
  providers: [CarTypeService, CarTypeRepository, AppProperties],
  exports: [CarTypeService],
})
export class CarFleetModule {}
