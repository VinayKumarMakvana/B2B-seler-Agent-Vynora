import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Lead } from '../../crm/entities/lead.entity';

export enum InvoiceStatus {
  VERIFICATION_PENDING = 'verification_pending',
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue'
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  proposalId: string;

  @Column({ type: 'uuid' })
  leadId: string;

  @ManyToOne(() => Lead)
  @JoinColumn({ name: 'leadId' })
  lead: Lead;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amountUsd: number;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.PENDING })
  status: InvoiceStatus;

  @Column({ type: 'varchar', nullable: true })
  proofUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
