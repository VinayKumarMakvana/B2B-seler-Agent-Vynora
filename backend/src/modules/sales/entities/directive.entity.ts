import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('directives')
export class Directive {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', default: 'user' })
  role: 'user' | 'ai';

  @CreateDateColumn()
  createdAt: Date;
}
