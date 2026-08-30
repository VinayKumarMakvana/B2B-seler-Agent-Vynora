import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Lead } from './lead.entity';

export enum MessageDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Lead)
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @Column({ type: 'enum', enum: MessageDirection })
  direction: MessageDirection;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  channel: string;

  @CreateDateColumn()
  createdAt: Date;
}
