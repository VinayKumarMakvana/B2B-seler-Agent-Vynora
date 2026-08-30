import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('approvals')
export class Approval {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  entityType: string;

  @Column({ type: 'uuid' })
  entityId: string;

  @Column({ type: 'int', default: 1 })
  entityVersion: number;

  @Column({ type: 'varchar', length: 255 })
  requestedAction: string;

  @Column({ type: 'jsonb', nullable: true })
  proposedContent: any;

  @Column({ type: 'text', nullable: true })
  aiReasoning: string;

  @Column({ type: 'varchar', length: 255, default: 'high' })
  riskLevel: string;

  @Column({ type: 'enum', enum: ApprovalStatus, default: ApprovalStatus.PENDING })
  status: ApprovalStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  approvedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
