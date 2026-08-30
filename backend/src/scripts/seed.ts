import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { Lead, LeadState } from '../modules/crm/entities/lead.entity';
import { Company } from '../modules/crm/entities/company.entity';
import { Contact } from '../modules/crm/entities/contact.entity';
import { Proposal, ProposalStatus } from '../modules/sales/entities/proposal.entity';
import { Directive } from '../modules/sales/entities/directive.entity';
import { Invoice, InvoiceStatus } from '../modules/delivery/entities/invoice.entity';
import { Opportunity, OpportunityStatus } from '../modules/crm/entities/opportunity.entity';
import { User } from '../modules/auth/entities/user.entity';
import { Role } from '../modules/auth/roles.decorator';
import * as bcrypt from 'bcrypt';

process.env.DISABLE_WORKERS = 'true';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  
  const leadRepo = dataSource.getRepository(Lead);
  const companyRepo = dataSource.getRepository(Company);
  const contactRepo = dataSource.getRepository(Contact);
  const proposalRepo = dataSource.getRepository(Proposal);
  const invoiceRepo = dataSource.getRepository(Invoice);
  const userRepo = dataSource.getRepository(User);

  console.log('Clearing old data and recreating schema...');
  await dataSource.synchronize(true);

  // Seed Admin User securely from ENV
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('FATAL ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must be provided in .env');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  
  await userRepo.save(userRepo.create({
    name: 'Vynora Admin',
    email: adminEmail,
    passwordHash,
    role: Role.OWNER
  }));

  // Seed Stale Lead for AI Processing
  const company = await companyRepo.save(companyRepo.create({
    name: 'TechFlow Solutions',
    domain: 'techflow.io',
    address: '123 Tech Lane, SF'
  }));

  const contact = await contactRepo.save(contactRepo.create({
    company,
    name: 'Sarah Chen',
    email: 'sarah@techflow.io',
    role: 'VP of Engineering',
    phone: '+1234567890'
  }));

  const staleDate = new Date();
  staleDate.setDate(staleDate.getDate() - 4); // 4 days ago (triggers 72h rule)

  await leadRepo.save(leadRepo.create({
    company,
    contact,
    status: LeadState.CONTACTED,
    source: 'Apollo Extraction',
    priorityScore: 85,
    createdAt: staleDate,
    updatedAt: staleDate
  }));

  console.log('Seeding complete! Admin user and Stale Lead ready.');
  
  await app.close();
  process.exit(0);
}

bootstrap().catch(err => {
  console.error('Seeding failed', err);
  process.exit(1);
});
