import { Controller, Post, Get, Body, HttpCode, BadRequestException, Param } from '@nestjs/common';
import { DeliveryOrchestratorService } from '../services/delivery-orchestrator.service';
import { NotificationsGateway } from '../../notifications/notifications.gateway';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import * as fs from 'fs';
import * as path from 'path';

@Controller('api/v1/payments')
export class PaymentController {
  constructor(
    private readonly deliveryOrchestrator: DeliveryOrchestratorService,
    private readonly notificationsGateway: NotificationsGateway,
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
  ) {}

  @Post('proof')
  @HttpCode(200)
  async uploadProof(
    @Body() body: { leadId: string, companyName: string, imageBase64: string, method: string }
  ) {
    if (!body.leadId || !body.imageBase64) throw new BadRequestException('Missing leadId or imageBase64');
    
    // Save image to disk (for MVP)
    const base64Data = body.imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const fileName = `proof_${body.leadId}_${Date.now()}.png`;
    const filePath = path.join(__dirname, '../../../../public/uploads', fileName);
    
    fs.writeFileSync(filePath, base64Data, 'base64');

    // Save Invoice to DB for verification
    const invoice = this.invoiceRepo.create({
      leadId: body.leadId,
      proposalId: '00000000-0000-0000-0000-000000000000', // Mock proposal ID
      amountUsd: 30000.00,
      status: InvoiceStatus.VERIFICATION_PENDING,
      proofUrl: `/uploads/${fileName}`
    });
    await this.invoiceRepo.save(invoice);

    // Notify BDM
    this.notificationsGateway.server.emit('PAYMENT_PROOF_RECEIVED', {
      leadId: body.leadId,
      companyName: body.companyName,
      method: body.method,
      proofUrl: `/uploads/${fileName}`
    });

    return { success: true, message: 'Proof uploaded and BDM notified.' };
  }

  @Get('pending')
  async getPendingProofs() {
    return this.invoiceRepo.find({
      where: { status: InvoiceStatus.VERIFICATION_PENDING },
      relations: {
        lead: {
          company: true
        }
      },
    });
  }

  @Post(':invoiceId/verify')
  async verifyPayment(@Param('invoiceId') invoiceId: string) {
    // 1. Mark as Paid and Trigger Handoff
    await this.deliveryOrchestrator.processSuccessfulPayment(invoiceId); 
    return { success: true, message: 'Payment Verified & Handoff Triggered' };
  }
}
