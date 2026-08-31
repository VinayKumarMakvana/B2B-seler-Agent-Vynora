import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { JobService } from '../../jobs/job.service';
import { DiscoveryService } from '../services/discovery.service';
import { AiStateService } from '../../integrations/ai/ai-state.service';

@Injectable()
export class DiscoveryWorker implements OnModuleInit {
  private readonly logger = new Logger(DiscoveryWorker.name);
  private isShuttingDown = false;

  constructor(
    private readonly jobService: JobService,
    private readonly discoveryService: DiscoveryService,
    private readonly aiState: AiStateService,
  ) {}

  onModuleInit() {
    if (process.env.DISABLE_WORKERS !== 'true') {
      setTimeout(() => this.startWorker(), 1000);
    }
  }

  private async startWorker() {
    this.logger.log('Starting Discovery worker loop');
    
    while (!this.isShuttingDown) {
      try {
        if (!this.aiState.isAgentRunning) {
          await new Promise(resolve => setTimeout(resolve, 3000));
          continue;
        }

        const job = await this.jobService.claimJob('discovery_run');
        if (job) {
          this.logger.log(`Processing discovery job: ${job.id}`);
          const { searchTerm, location } = job.payload;
          
          await this.discoveryService.runDiscovery(searchTerm, location);
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
