import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { FollowupGeneratorService } from './followup-generator.service';
import { Lead, LeadState } from '../../crm/entities/lead.entity';
import { Approval, ApprovalStatus } from '../../crm/entities/approval.entity';

@Injectable()
export class FollowupOrchestratorService {
  private readonly logger = new Logger(FollowupOrchestratorService.name);
  
  // Configured Interval: 72 hours
  private readonly INTERVAL_MS = 3 * 24 * 60 * 60 * 1000;

  constructor(
    private readonly generator: FollowupGeneratorService,
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

    // Fail closed: Always require manual approval for follow-ups to prevent runaway loops
    await this.approvalRepo.save(this.approvalRepo.create({
      entityType: 'lead_followup',
      entityId: lead.id,
      requestedAction: 'send_followup',
      proposedContent: { bumpText, followUpNumber },
      aiReasoning: `Generated follow-up #${followUpNumber} due to 72h silence`,
      status: ApprovalStatus.PENDING,
      riskLevel: 'medium'
    }));
    
    // Advance state to reflect it has entered the follow-up bucket
    lead.status = nextState;
    await this.leadRepo.save(lead);

    this.logger.log(`Created PENDING approval for Lead ${lead.id} follow-up #${followUpNumber}.`);
  }
}
