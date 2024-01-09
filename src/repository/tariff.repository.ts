import { EntityRepository, Repository } from 'typeorm';

import { Tariff } from '../entity/tariff.entity';

@EntityRepository(Tariff)
export class TariffRepository extends Repository<Tariff> {}
