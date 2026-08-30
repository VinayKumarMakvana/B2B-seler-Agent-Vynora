import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingService, ProjectComplexity } from './pricing.service';
import { ProposalGeneratorService } from './proposal-generator.service';
import { Proposal, ProposalStatus } from '../entities/proposal.entity';
import { Lead, LeadState } from '../../crm/entities/lead.entity';
import { Approval, ApprovalStatus } from '../../crm/entities/approval.entity';

@Injectable()
export class SalesOrchestratorService {
  private readonly logger = new Logger(SalesOrchestratorService.name);

  constructor(
    private readonly pricingService: PricingService,
    private readonly generatorService: ProposalGeneratorService,
    @InjectRepository(Proposal) private proposalRepo: Repository<Proposal>,
    @InjectRepository(Lead) private leadRepo: Repository<Lead>,
    @InjectRepository(Approval) private approvalRepo: Repository<Approval>,
  ) {}

  async generateProposal(leadId: string, discoveryNotes: string, complexity: ProjectComplexity, durationWeeks: number): Promise<void> {
    const lead = await this.leadRepo.findOne({ where: { id: leadId } });
    
    // In a real flow, Lead would be DISCOVERY_COMPLETE. We accept it for the demo.
    if (!lead) {
      this.logger.warn(`Lead ${leadId} not found.`);
      return;
    }

    // 1. Strict Deterministic Pricing
    const lockedPrice = this.pricingService.calculatePrice(complexity, durationWeeks);

    // 2. AI Scope Generation (No pricing access)
    const scopeData = await this.generatorService.draftScopeSummary(discoveryNotes);

    // 3. Create Draft Proposal Entity
    const proposal = this.proposalRepo.create({
      leadId: lead.id,
      version: 1,
      scopeData,
      priceUsd: lockedPrice,
      status: ProposalStatus.DRAFT
    });
    await this.proposalRepo.save(proposal);

    // 4. Require Manual Approval before sending. Proposals are CRITICAL risk.
    await this.approvalRepo.save(this.approvalRepo.create({
      entityType: 'proposal',
      entityId: proposal.id,
      requestedAction: 'send_proposal',
      proposedContent: { 
        title: scopeData.title,
        price: lockedPrice,
        summary: scopeData.executiveSummary,
        deliverables: scopeData.deliverables
      },
      aiReasoning: `Generated Proposal v1 based on Discovery Notes. Price strictly calculated by Engine.`,
      status: ApprovalStatus.PENDING,
      riskLevel: 'critical'
    }));

    // 5. Update Lead State
    lead.status = LeadState.PROPOSAL_PENDING;
    await this.leadRepo.save(lead);

    this.logger.log(`Generated Draft Proposal for Lead ${lead.id} with strict price $${lockedPrice}`);
  }
}
