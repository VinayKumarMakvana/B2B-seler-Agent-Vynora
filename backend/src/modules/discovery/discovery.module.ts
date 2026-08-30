import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeduplicationService } from './services/deduplication.service';
import { PriorityScoringService } from './services/priority-scoring.service';
import { DiscoveryService } from './services/discovery.service';
import { DiscoveryWorker } from './jobs/discovery.worker';
import { Company } from '../crm/entities/company.entity';
import { Contact } from '../crm/entities/contact.entity';
import { Lead } from '../crm/entities/lead.entity';
import { IntegrationsModule } from '../integrations/integrations.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, Contact, Lead]),
    IntegrationsModule,
    JobsModule,
  ],
  providers: [
    DeduplicationService,
    PriorityScoringService,
    DiscoveryService,
    DiscoveryWorker,
  ],
})
export class DiscoveryModule {}
