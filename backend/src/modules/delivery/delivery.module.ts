import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { Lead } from '../crm/entities/lead.entity';
import { DeliveryOrchestratorService } from './services/delivery-orchestrator.service';
import { PaymentController } from './controllers/payment.controller';
import { InvoiceController } from './controllers/invoice.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, Lead]),
  ],
  controllers: [PaymentController, InvoiceController],
  providers: [
    DeliveryOrchestratorService,
  ],
  exports: [DeliveryOrchestratorService]
})
export class DeliveryModule {}
