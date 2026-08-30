import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Lead } from '../../crm/entities/lead.entity';
export enum ProposalStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  NEGOTIATING = 'negotiating',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

@Entity('proposals')
export class Proposal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  leadId: string;

  @ManyToOne(() => Lead)
  @JoinColumn({ name: 'leadId' })
  lead: Lead;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'jsonb' })
  scopeData: any; // AI generated scope summary

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  priceUsd: number; // Strictly deterministically calculated

  @Column({ type: 'enum', enum: ProposalStatus, default: ProposalStatus.DRAFT })
  status: ProposalStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
