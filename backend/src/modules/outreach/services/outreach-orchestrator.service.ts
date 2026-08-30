import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutreachGeneratorService } from './outreach-generator.service';
import { Lead, LeadState } from '../../crm/entities/lead.entity';
import { Approval, ApprovalStatus } from '../../crm/entities/approval.entity';

@Injectable()
export class OutreachOrchestratorService {
  private readonly logger = new Logger(OutreachOrchestratorService.name);
  
  // Configuration for auto-send threshold
  private readonly AUTO_SEND_THRESHOLD = 9;

  constructor(
    private readonly outreachGenerator: OutreachGeneratorService,
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

    // Enforce Fail-Closed / Auto-Send Logic
    if (lead.priorityScore && lead.priorityScore >= this.AUTO_SEND_THRESHOLD) {
      // Concrete sending logic via EmailProviderService would go here
      this.logger.log(`Auto-sending outreach for high-priority Lead ${leadId}`);
      lead.status = LeadState.CONTACTED;
    } else {
      // Require manual approval
      await this.approvalRepo.save(this.approvalRepo.create({
        entityType: 'lead_outreach',
        entityId: lead.id,
        requestedAction: 'send_initial_hook',
        proposedContent: { hookText },
        aiReasoning: `Generated initial hook based on priority score ${lead.priorityScore}`,
        status: ApprovalStatus.PENDING,
        riskLevel: 'high'
      }));
      this.logger.log(`Created PENDING approval for Lead ${leadId} outreach.`);
    }

    await this.leadRepo.save(lead);
  }
}
