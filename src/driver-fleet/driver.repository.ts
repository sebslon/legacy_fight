import { EntityRepository, Repository } from 'typeorm';

import { Driver } from './driver.entity';

@EntityRepository(Driver)
export class DriverRepository extends Repository<Driver> {}
