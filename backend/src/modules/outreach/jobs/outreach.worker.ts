import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { JobService } from '../../jobs/job.service';
import { OutreachOrchestratorService } from '../services/outreach-orchestrator.service';
import { AiStateService } from '../../integrations/ai/ai-state.service';

@Injectable()
export class OutreachWorker implements OnModuleInit {
  private readonly logger = new Logger(OutreachWorker.name);
  private isShuttingDown = false;

  constructor(
    private readonly jobService: JobService,
    private readonly orchestrator: OutreachOrchestratorService,
    private readonly aiState: AiStateService,
  ) {}

  onModuleInit() {
    if (process.env.DISABLE_WORKERS !== 'true') {
      setTimeout(() => this.startWorker(), 1000);
    }
  }

  private async startWorker() {
    this.logger.log('Starting Outreach worker loop');
    
    while (!this.isShuttingDown) {
      try {
        if (!this.aiState.isAgentRunning) {
          await new Promise(resolve => setTimeout(resolve, 3000));
          continue;
        }

        const job = await this.jobService.claimJob('outreach_run');
        if (job) {
          this.logger.log(`Processing outreach job: ${job.id}`);
          const { leadId } = job.payload;
          
          await this.orchestrator.processLeadOutreach(leadId);
          await this.jobService.completeJob(job.id);
        } else {
          const pollInterval = process.env.NODE_ENV === 'production' ? 10000 : 2000;
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
      } catch (error: any) {
        this.logger.error('Worker error', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
}
