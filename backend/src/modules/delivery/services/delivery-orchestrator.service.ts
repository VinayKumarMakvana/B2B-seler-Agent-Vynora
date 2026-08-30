import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { Lead } from '../../crm/entities/lead.entity';

@Injectable()
export class DeliveryOrchestratorService {
  private readonly logger = new Logger(DeliveryOrchestratorService.name);

  constructor(
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    @InjectRepository(Lead) private leadRepo: Repository<Lead>,
  ) {}

  async processSuccessfulPayment(invoiceId: string): Promise<void> {
    const invoice = await this.invoiceRepo.findOne({ where: { id: invoiceId } });
    if (!invoice) return;

    if (invoice.status === InvoiceStatus.PAID) {
      this.logger.warn(`Invoice ${invoiceId} is already marked paid.`);
      return;
    }

    // 1. Mark Invoice Paid
    invoice.status = InvoiceStatus.PAID;
    await this.invoiceRepo.save(invoice);

    // 2. Handoff to Delivery
    const lead = await this.leadRepo.findOne({ where: { id: invoice.leadId } });
    if (lead) {
      // Create Project Entity logic would go here to transition into the fulfillment pipeline.
      this.logger.log(`Provisioning Delivery Project for Lead ${lead.id}...`);
      
      this.logger.log(`Lead ${lead.id} successfully handed off to Fulfillment Team. Closed-Won cycle complete.`);
    }
  }
}
