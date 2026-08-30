import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { Company } from './company.entity';
import { Contact } from './contact.entity';

export enum LeadState {
  NEW = 'new',
  RESEARCHING = 'researching',
  QUALIFIED = 'qualified',
  OUTREACH_READY = 'outreach_ready',
  CONTACTED = 'contacted',
  AWAITING_RESPONSE = 'awaiting_response',
  INTERESTED = 'interested',
  NOT_INTERESTED = 'not_interested',
  FOLLOW_UP = 'follow_up',
  MEETING_REQUESTED = 'meeting_requested',
  MEETING_SCHEDULED = 'meeting_scheduled',
  DISCOVERY_COMPLETE = 'discovery_complete',
  PROPOSAL_PENDING = 'proposal_pending',
  PROPOSAL_SENT = 'proposal_sent',
  NEGOTIATION = 'negotiation',
  DECISION_PENDING = 'decision_pending',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost',
  EXPIRED = 'expired',
  NURTURE = 'nurture',
  SUPPRESSED = 'suppressed',
  UNSUBSCRIBE = 'unsubscribe'
}

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Company, (company) => company.leads)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => Contact, { nullable: true })
  @JoinColumn({ name: 'contact_id' })
  contact: Contact;

  @OneToOne('Opportunity', 'lead')
  opportunity: any;

  @ManyToOne('User', 'leads', { nullable: true })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo: any;

  @Column({ type: 'enum', enum: LeadState, default: LeadState.NEW })
  status: LeadState;

  @Column({ type: 'int', default: 0 })
  priorityScore: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  source: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
