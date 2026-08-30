import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { JobService } from './job.service';

@Injectable()
export class WorkerService implements OnModuleInit {
  private readonly logger = new Logger(WorkerService.name);
  private isShuttingDown = false;

  constructor(private readonly jobService: JobService) {}

  onModuleInit() {
    // Start continuous polling background workers without blocking the main event loop
    // Domain specific workers (e.g., FollowupWorker) handle specific job types
  }

  private async startWorker(jobType: string, handler: (payload: any) => Promise<void>, pollInterval = 5000) {
    if (process.env.DISABLE_WORKERS === 'true') {
      this.logger.warn(`Worker disabled for job type: ${jobType}`);
      return;
    }

    this.logger.log(`Starting worker loop for job type: ${jobType}`);
    
    while (!this.isShuttingDown) {
      try {
        const job = await this.jobService.claimJob(jobType);
        if (job) {
          this.logger.log(`Claimed job: ${job.id} of type ${jobType}`);
          try {
            await handler(job.payload);
            await this.jobService.completeJob(job.id);
          } catch (handlerError: any) {
            await this.jobService.failJob(job.id, handlerError.message);
          }
        } else {
          // Backoff polling if queue is empty
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
      } catch (error) {
        this.logger.error(`Worker queue error for ${jobType}`, error);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }
  }
}
