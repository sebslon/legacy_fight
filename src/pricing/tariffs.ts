import { Injectable } from '@nestjs/common';

import { Clock } from '../common/clock';

import { Tariff } from './tariff';

@Injectable()
export class Tariffs {
  public choose(when: Date) {
    if (!when) {
      when = Clock.currentDate();
    }

    return Tariff.ofTime(when);
  }
}
