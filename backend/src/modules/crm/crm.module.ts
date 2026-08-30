import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { Contact } from './entities/contact.entity';
import { Lead } from './entities/lead.entity';
import { Opportunity } from './entities/opportunity.entity';
import { Message } from './entities/message.entity';
import { Approval } from './entities/approval.entity';
import { Invoice } from '../delivery/entities/invoice.entity';
import { LeadStateMachineService } from './services/lead-state-machine.service';
import { LeadController } from './controllers/lead.controller';
import { ApprovalController } from './controllers/approval.controller';
import { AnalyticsController } from './controllers/analytics.controller';

import { EmailModule } from '../integrations/email/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([Company, Contact, Lead, Opportunity, Message, Approval, Invoice]), EmailModule],
  controllers: [LeadController, ApprovalController, AnalyticsController],
  providers: [LeadStateMachineService],
  exports: [TypeOrmModule, LeadStateMachineService],
})
export class CrmModule {}
