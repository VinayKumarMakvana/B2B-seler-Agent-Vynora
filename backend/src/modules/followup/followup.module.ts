import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from '../crm/entities/lead.entity';
import { Approval } from '../crm/entities/approval.entity';
import { IntegrationsModule } from '../integrations/integrations.module';
import { JobsModule } from '../jobs/jobs.module';
import { FollowupGeneratorService } from './services/followup-generator.service';
import { FollowupOrchestratorService } from './services/followup-orchestrator.service';
import { FollowupWorker } from './jobs/followup.worker';
import { FollowupCronService } from './jobs/followup.cron';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lead, Approval]),
    IntegrationsModule,
    JobsModule,
  ],
  providers: [
    FollowupGeneratorService,
    FollowupOrchestratorService,
    FollowupWorker,
    FollowupCronService,
  ],
})
export class FollowupModule {}
