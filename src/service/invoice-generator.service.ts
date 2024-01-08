import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Invoice } from '../entity/invoice.entity';
import { InvoiceRepository } from '../repository/invoice.repository';

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
