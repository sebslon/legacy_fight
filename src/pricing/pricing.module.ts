import { Module } from '@nestjs/common';

import { Tariffs } from './tariffs';

@Module({
  imports: [],
  controllers: [],
  providers: [Tariffs],
  exports: [Tariffs],
})
export class PricingModule {}
