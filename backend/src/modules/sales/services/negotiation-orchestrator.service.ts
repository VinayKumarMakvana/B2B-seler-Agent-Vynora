import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingService, ProjectComplexity } from './pricing.service';
import { ProposalGeneratorService } from './proposal-generator.service';
import { Proposal, ProposalStatus } from '../entities/proposal.entity';
import { Lead, LeadState } from '../../crm/entities/lead.entity';
import { Approval, ApprovalStatus } from '../../crm/entities/approval.entity';

@Injectable()
export class NegotiationOrchestratorService {
  private readonly logger = new Logger(NegotiationOrchestratorService.name);

  constructor(
    private readonly pricingService: PricingService,
    private readonly generatorService: ProposalGeneratorService,
    @InjectRepository(Proposal) private proposalRepo: Repository<Proposal>,
    @InjectRepository(Lead) private leadRepo: Repository<Lead>,
    @InjectRepository(Approval) private approvalRepo: Repository<Approval>,
  ) {}

  async processNegotiation(proposalId: string, requestedChanges: string, newComplexity: ProjectComplexity, newDurationWeeks: number): Promise<void> {
    const previousProposal = await this.proposalRepo.findOne({ where: { id: proposalId } });
    if (!previousProposal) return;
    
    const lead = await this.leadRepo.findOne({ where: { id: previousProposal.leadId } });
    if (!lead) return;

    // Strict Rule: AI must cut scope for lower price (Margin Protection)
    const revisedScope = await this.generatorService.draftRevisedScope(previousProposal.scopeData, requestedChanges);
    const newPrice = this.pricingService.calculatePrice(newComplexity, newDurationWeeks);

    const newProposal = this.proposalRepo.create({
      leadId: lead.id,
      version: previousProposal.version + 1,
      scopeData: revisedScope,
      priceUsd: newPrice,
      status: ProposalStatus.DRAFT
    });
    await this.proposalRepo.save(newProposal);

    // Staging the revised proposal
    await this.approvalRepo.save(this.approvalRepo.create({
      entityType: 'proposal_revision',
      entityId: newProposal.id,
      requestedAction: 'send_revised_proposal',
      proposedContent: { 
        originalPrice: previousProposal.priceUsd,
        newPrice: newPrice,
        newScope: revisedScope
      },
      aiReasoning: `Generated Revised Proposal v${newProposal.version} explicitly cutting deliverables to match lower budget/complexity.`,
      status: ApprovalStatus.PENDING,
      riskLevel: 'critical'
    }));

    previousProposal.status = ProposalStatus.NEGOTIATING;
    await this.proposalRepo.save(previousProposal);

    lead.status = LeadState.NEGOTIATION;
    await this.leadRepo.save(lead);
    
    this.logger.log(`Generated Revised Proposal for Lead ${lead.id} with strict price $${newPrice}`);
  }
}
