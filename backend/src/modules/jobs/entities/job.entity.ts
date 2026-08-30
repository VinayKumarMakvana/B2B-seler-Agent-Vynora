import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  type: string;

  @Column({ type: 'jsonb' })
  payload: any;

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.PENDING })
  status: JobStatus;

  @Column({ type: 'timestamp', nullable: true })
  runAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lockedAt: Date;

  @Column({ type: 'int', default: 0 })
  errorCount: number;

  @Column({ type: 'text', nullable: true })
  lastError: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  idempotencyKey: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
