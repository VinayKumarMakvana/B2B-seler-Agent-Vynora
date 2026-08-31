import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutreachGeneratorService } from './outreach-generator.service';
import { Lead, LeadState } from '../../crm/entities/lead.entity';
import { Approval, ApprovalStatus } from '../../crm/entities/approval.entity';

import { EmailService } from '../../integrations/email/email.service';

@Injectable()
export class OutreachOrchestratorService {
  private readonly logger = new Logger(OutreachOrchestratorService.name);

  constructor(
    private readonly outreachGenerator: OutreachGeneratorService,
    private readonly emailService: EmailService,
    @InjectRepository(Lead) private leadRepo: Repository<Lead>,
    @InjectRepository(Approval) private approvalRepo: Repository<Approval>,
  ) {}

  async processLeadOutreach(leadId: string): Promise<void> {
    const lead = await this.leadRepo.findOne({ 
      where: { id: leadId },
      relations: { company: true, contact: true }
    });

    if (!lead) {
      throw new BadRequestException('Lead not found');
    }

    if (lead.status !== LeadState.NEW) {
      this.logger.warn(`Lead ${leadId} is not in NEW state. Skipping outreach.`);
      return;
    }

    const context = {
      companyName: lead.company?.name,
      domain: lead.company?.domain,
      contactName: lead.contact?.name,
      priorityScore: lead.priorityScore,
    };

    const hookText = await this.outreachGenerator.generateHook(context);

    if (!hookText) {
      this.logger.warn(`Failed to generate hook for Lead ${leadId}. manual intervention needed.`);
      return;
    }

    // Fully Autonomous Auto-Send Logic
    this.logger.log(`Auto-sending outreach for Lead ${leadId}`);
    try {
      const toEmail = lead.contact?.email;
      if (toEmail) {
        await this.emailService.sendEmail(toEmail, 'A brief question about your process', hookText);
        lead.status = LeadState.CONTACTED;
      } else {
        this.logger.warn(`Lead ${lead.id} has no contact email. Cannot auto-send.`);
      }
    } catch (error) {
      this.logger.error(`Failed to auto-send email to Lead ${lead.id}`, error);
    }

    await this.leadRepo.save(lead);
  }
}
