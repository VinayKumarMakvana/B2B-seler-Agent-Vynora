import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Lead } from './lead.entity';

export enum OpportunityStatus {
  OPEN = 'open',
  WON = 'won',
  LOST = 'lost'
}

@Entity('opportunities')
export class Opportunity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Lead, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @Column({ type: 'jsonb', nullable: true })
  discoveryData: any;

  @Column({ type: 'text', nullable: true })
  projectRequirements: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valueUsd: number;

  @Column({ type: 'enum', enum: OpportunityStatus, default: OpportunityStatus.OPEN })
  status: OpportunityStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
