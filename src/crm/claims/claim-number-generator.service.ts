import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as dayjs from 'dayjs';

import { Claim } from './claim.entity';
import { ClaimRepository } from './claim.repository';

@Injectable()
export class ClaimNumberGenerator {
  constructor(
    @InjectRepository(ClaimRepository)
    private claimRepository: ClaimRepository,
  ) {}

  public async generate(claim: Claim) {
    const count = await this.claimRepository.count();
    let prefix = count;
    if (count === 0) {
      prefix = 1;
    }
    const DATE_TIME_FORMAT = 'dd/MM/yyyy';
    return (
      prefix +
      count +
      '---' +
      dayjs(claim.getCreationDate()).format(DATE_TIME_FORMAT)
    );
  }
}
