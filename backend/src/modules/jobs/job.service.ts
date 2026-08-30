import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job, JobStatus } from './entities/job.entity';

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);

  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
  ) {}

  async createJob(type: string, payload: any, idempotencyKey?: string, runAt?: Date): Promise<Job> {
    try {
      const job = this.jobRepository.create({
        type,
        payload,
        idempotencyKey,
        runAt: runAt || new Date(),
      });
      return await this.jobRepository.save(job);
    } catch (error: any) {
      if (error.code === '23505') { // Postgres unique constraint violation
        this.logger.warn(`Job with idempotency key ${idempotencyKey} already exists.`);
        const existingJob = await this.jobRepository.findOne({ where: { idempotencyKey } });
        return existingJob as Job;
      }
      throw error;
    }
  }

  async claimJob(type: string): Promise<Job | null> {
    try {
      const now = new Date();
      const result = await this.jobRepository.query(`
        UPDATE jobs
        SET status = 'running', "lockedAt" = $2
        WHERE id = (
          SELECT id
          FROM jobs
          WHERE status = 'pending'
            AND type = $1
            AND ("runAt" IS NULL OR "runAt" <= $2)
          ORDER BY "createdAt" ASC
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        )
        RETURNING *;
      `, [type, now]);

      if (result && Array.isArray(result) && result[0]) {
         const row = Array.isArray(result[0]) ? result[0][0] : result[0];
         if (row && row.id) {
           return row as Job;
         }
      }
      return null;
    } catch (error) {
      this.logger.error('Error claiming job', error);
      return null;
    }
  }

  async completeJob(jobId: string): Promise<void> {
    await this.jobRepository.update(jobId, { status: JobStatus.COMPLETED });
  }

  async failJob(jobId: string, error: string): Promise<void> {
    const job = await this.jobRepository.findOne({ where: { id: jobId } });
    if (!job) return;

    job.errorCount += 1;
    job.lastError = error;
    
    // Max 2 retries => total 3 attempts (as per spec)
    if (job.errorCount >= 3) {
      job.status = JobStatus.FAILED;
      this.logger.error(`Job ${jobId} failed permanently: ${error}`);
    } else {
      job.status = JobStatus.PENDING;
      job.lockedAt = null as any;
      // 30 min base backoff
      const nextRun = new Date();
      nextRun.setMinutes(nextRun.getMinutes() + (30 * job.errorCount));
      job.runAt = nextRun;
    }

    await this.jobRepository.save(job);
  }
}
