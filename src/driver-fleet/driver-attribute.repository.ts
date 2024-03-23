import { EntityRepository, Repository } from 'typeorm';

import { DriverAttribute } from './driver-attribute.entity';

@EntityRepository(DriverAttribute)
export class DriverAttributeRepository extends Repository<DriverAttribute> {}
