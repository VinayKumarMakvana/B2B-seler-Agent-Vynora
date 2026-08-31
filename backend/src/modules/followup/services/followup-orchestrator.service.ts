import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { FollowupGeneratorService } from './followup-generator.service';
import { Lead, LeadState } from '../../crm/entities/lead.entity';
import { Approval, ApprovalStatus } from '../../crm/entities/approval.entity';

import { EmailService } from '../../integrations/email/email.service';

@Injectable()
export class FollowupOrchestratorService {
  private readonly logger = new Logger(FollowupOrchestratorService.name);
  
  // Configured Interval: 72 hours
  private readonly INTERVAL_MS = 3 * 24 * 60 * 60 * 1000;

  constructor(
    private readonly generator: FollowupGeneratorService,
    private readonly emailService: EmailService,
    @InjectRepository(Lead) private leadRepo: Repository<Lead>,
    @InjectRepository(Approval) private approvalRepo: Repository<Approval>,
  ) {}

  async getStaleLeads(): Promise<Lead[]> {
    const cutoffDate = new Date(Date.now() - this.INTERVAL_MS);
    return this.leadRepo.find({
      where: [
        { status: LeadState.CONTACTED, updatedAt: LessThan(cutoffDate) },
        { status: LeadState.FOLLOW_UP, updatedAt: LessThan(cutoffDate) },
      ],
      relations: { company: true, contact: true }
    });
  }

  async processFollowUp(leadId: string): Promise<void> {
    const lead = await this.leadRepo.findOne({ 
      where: { id: leadId },
      relations: { company: true, contact: true }
    });

    if (!lead) return;

    let nextState: LeadState;
    let followUpNumber = 0;

    switch (lead.status) {
      case LeadState.CONTACTED:
        nextState = LeadState.FOLLOW_UP;
        followUpNumber = 1;
        break;
      case LeadState.FOLLOW_UP:
        // Anti-Spam Safety: Hard Cap Reached
        this.logger.log(`Lead ${lead.id} reached follow-up limit. Transitioning to SUPPRESSED.`);
        lead.status = LeadState.SUPPRESSED;
        await this.leadRepo.save(lead);
        return;
      default:
        this.logger.warn(`Lead ${lead.id} is in invalid state ${lead.status} for follow up.`);
        return;
    }

    const context = {
      companyName: lead.company?.name,
      contactName: lead.contact?.name,
    };

    const bumpText = await this.generator.generateBump(context, followUpNumber);

    // Fully Autonomous Auto-Send Logic
    this.logger.log(`Auto-sending follow-up #${followUpNumber} for Lead ${lead.id}`);
    try {
      const toEmail = lead.contact?.email;
      if (toEmail) {
        await this.emailService.sendEmail(toEmail, `Following up: ${context.companyName || 'Vynora'}`, bumpText);
        lead.status = nextState;
      } else {
        this.logger.warn(`Lead ${lead.id} has no contact email. Cannot auto-send.`);
      }
    } catch (error) {
      this.logger.error(`Failed to auto-send email to Lead ${lead.id}`, error);
    }

    await this.leadRepo.save(lead);
  }
}
