import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from '../crm/entities/lead.entity';
import { Approval } from '../crm/entities/approval.entity';
import { IntegrationsModule } from '../integrations/integrations.module';
import { JobsModule } from '../jobs/jobs.module';
import { OutreachGeneratorService } from './services/outreach-generator.service';
import { OutreachOrchestratorService } from './services/outreach-orchestrator.service';
import { OutreachWorker } from './jobs/outreach.worker';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lead, Approval]),
    IntegrationsModule,
    JobsModule,
  ],
  providers: [
    OutreachGeneratorService,
    OutreachOrchestratorService,
    OutreachWorker,
  ],
})
export class OutreachModule {}
