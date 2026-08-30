import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Contact } from './contact.entity';
import { Lead } from './lead.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  domain: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @OneToMany(() => Contact, (contact) => contact.company)
  contacts: Contact[];

  @OneToMany(() => Lead, (lead) => lead.company)
  leads: Lead[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
