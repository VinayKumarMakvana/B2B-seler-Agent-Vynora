import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { JobService } from '../../jobs/job.service';
import { FollowupOrchestratorService } from '../services/followup-orchestrator.service';
import { AiStateService } from '../../integrations/ai/ai-state.service';

@Injectable()
export class FollowupWorker implements OnModuleInit {
  private readonly logger = new Logger(FollowupWorker.name);
  private isShuttingDown = false;

  constructor(
    private readonly jobService: JobService,
    private readonly orchestrator: FollowupOrchestratorService,
    private readonly aiState: AiStateService,
  ) {}

  onModuleInit() {
    if (process.env.DISABLE_WORKERS !== 'true') {
      setTimeout(() => this.startWorker(), 1000);
    }
  }

  private async startWorker() {
    this.logger.log('Starting Followup worker loop');
    
    while (!this.isShuttingDown) {
      try {
        if (!this.aiState.isAgentRunning) {
          await new Promise(resolve => setTimeout(resolve, 3000));
          continue;
        }

        const job = await this.jobService.claimJob('followup_run');
        if (job) {
          this.logger.log(`Processing followup job: ${job.id}`);
          const { leadId } = job.payload;
          
          await this.orchestrator.processFollowUp(leadId);
          await this.jobService.completeJob(job.id);
        } else {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } catch (error: any) {
        this.logger.error('Worker error', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
}
