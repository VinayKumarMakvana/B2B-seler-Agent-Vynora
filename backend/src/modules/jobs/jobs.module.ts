import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from './entities/job.entity';
import { JobService } from './job.service';
import { WorkerService } from './worker.service';

@Module({
  imports: [TypeOrmModule.forFeature([Job])],
  providers: [JobService, WorkerService],
  exports: [JobService],
})
export class JobsModule {}
