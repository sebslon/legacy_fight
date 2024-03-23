import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InvoiceGenerator } from './invoice-generator.service';
import { Invoice } from './invoice.entity';
import { InvoiceRepository } from './invoice.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, InvoiceRepository])],
  providers: [InvoiceGenerator],
  exports: [InvoiceGenerator],
})
export class InvoiceModule {}
