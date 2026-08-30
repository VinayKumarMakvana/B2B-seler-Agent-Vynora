import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proposal } from './entities/proposal.entity';
import { Directive } from './entities/directive.entity';
import { Lead } from '../crm/entities/lead.entity';
import { Approval } from '../crm/entities/approval.entity';
import { IntegrationsModule } from '../integrations/integrations.module';
import { DeliveryModule } from '../delivery/delivery.module';
import { PricingService } from './services/pricing.service';
import { ProposalGeneratorService } from './services/proposal-generator.service';
import { SalesOrchestratorService } from './services/sales-orchestrator.service';
import { NegotiationOrchestratorService } from './services/negotiation-orchestrator.service';
import { ClosingController } from './controllers/closing.controller';
import { DirectiveController } from './controllers/directive.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Proposal, Directive, Lead, Approval]),
    IntegrationsModule,
    DeliveryModule,
  ],
  controllers: [ClosingController, DirectiveController],
  providers: [
    PricingService,
    ProposalGeneratorService,
    SalesOrchestratorService,
    NegotiationOrchestratorService,
  ],
  exports: [SalesOrchestratorService, NegotiationOrchestratorService]
})
export class SalesModule {}
