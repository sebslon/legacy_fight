import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Invoice } from './invoice.entity';
import { InvoiceRepository } from './invoice.repository';

@Injectable()
export class InvoiceGenerator {
  constructor(
    @InjectRepository(InvoiceRepository)
    private invoiceRepository: InvoiceRepository,
  ) {}

  public async generate(amount: number, subjectName: string) {
    return this.invoiceRepository.save(new Invoice(amount, subjectName));
  }
}
