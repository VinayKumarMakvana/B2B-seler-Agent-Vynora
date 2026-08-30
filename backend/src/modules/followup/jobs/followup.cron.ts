import { Injectable, Logger } from '@nestjs/common';
import { JobService } from '../../jobs/job.service';
import { FollowupOrchestratorService } from '../services/followup-orchestrator.service';

@Injectable()
export class FollowupCronService {
  private readonly logger = new Logger(FollowupCronService.name);

  constructor(
    private readonly orchestrator: FollowupOrchestratorService,
    private readonly jobService: JobService,
  ) {
    if (process.env.DISABLE_WORKERS === 'true') return;

    // Standard mock interval scanner. 
    setTimeout(() => this.runCron(), 5000); // Initial run after 5 seconds
    setInterval(() => this.runCron(), 60 * 60 * 1000); // Scans every 1 hour
  }

  async runCron() {
    this.logger.log('Running scheduled Follow-Up scan');
    try {
      const staleLeads = await this.orchestrator.getStaleLeads();
      
      for (const lead of staleLeads) {
        // Pushes the task into the resilient Postgres queue using the current state as part of the idempotency key 
        // to prevent duplicate scheduling for the same follow-up phase.
        await this.jobService.createJob(
          'followup_run', 
          { leadId: lead.id },
          `followup-${lead.id}-${lead.status}`
        );
      }
      
      if (staleLeads.length > 0) {
        this.logger.log(`Scheduled ${staleLeads.length} leads for follow-up evaluation`);
      }
    } catch (error) {
      this.logger.error('Cron scan failed', error);
    }
  }
}
