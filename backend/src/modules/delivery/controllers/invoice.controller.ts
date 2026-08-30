import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../entities/invoice.entity';

@Controller('api/v1/invoices')
export class InvoiceController {
  constructor(
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
  ) {}

  @Get()
  async getInvoices() {
    return this.invoiceRepo.find({
      relations: {
        lead: {
          company: true,
          contact: true
        }
      },
      order: { createdAt: 'DESC' }
    });
  }
}
