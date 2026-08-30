import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from '../crm/entities/message.entity';
import { Approval } from '../crm/entities/approval.entity';
import { Lead } from '../crm/entities/lead.entity';
import { Invoice } from '../delivery/entities/invoice.entity';
import { IntegrationsModule } from '../integrations/integrations.module';
import { IntentClassifierService } from './services/intent-classifier.service';
import { DraftGeneratorService } from './services/draft-generator.service';
import { ResponseOrchestratorService } from './services/response-orchestrator.service';
import { WebhookController } from './controllers/webhook.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Approval, Lead, Invoice]),
    IntegrationsModule,
  ],
  controllers: [WebhookController],
  providers: [
    IntentClassifierService,
    DraftGeneratorService,
    ResponseOrchestratorService,
  ],
})
export class ResponseModule {}
