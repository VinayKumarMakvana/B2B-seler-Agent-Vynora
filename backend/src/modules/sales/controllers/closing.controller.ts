import { Controller, Post, Get, Param, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proposal, ProposalStatus } from '../entities/proposal.entity';
import { Lead, LeadState } from '../../crm/entities/lead.entity';

@Controller('api/v1/closing')
export class ClosingController {
  constructor(
    @InjectRepository(Proposal) private proposalRepo: Repository<Proposal>,
    @InjectRepository(Lead) private leadRepo: Repository<Lead>,
  ) {}

  @Get('proposals')
  async getProposals() {
    return this.proposalRepo.find({
      where: { status: ProposalStatus.SENT },
      relations: {
        lead: {
          company: true,
          contact: true
        }
      },
      order: { createdAt: 'DESC' }
    });
  }

  @Get('negotiations')
  async getNegotiations() {
    return this.proposalRepo.find({
      where: { status: ProposalStatus.NEGOTIATING },
      relations: {
        lead: {
          company: true,
          contact: true
        }
      },
      order: { createdAt: 'DESC' }
    });
  }

  @Post(':id/accept')
  async acceptProposal(@Param('id') id: string) {
    const proposal = await this.proposalRepo.findOne({ where: { id } });
    if (!proposal) throw new NotFoundException('Proposal not found');

    proposal.status = ProposalStatus.ACCEPTED;
    await this.proposalRepo.save(proposal);

    const lead = await this.leadRepo.findOne({ where: { id: proposal.leadId } });
    if (lead) {
      lead.status = LeadState.DECISION_PENDING;
      await this.leadRepo.save(lead);
    }
    
    return { success: true, status: 'DECISION_PENDING' };
  }

  @Post(':id/reject')
  async rejectProposal(@Param('id') id: string) {
    const proposal = await this.proposalRepo.findOne({ where: { id } });
    if (!proposal) throw new NotFoundException('Proposal not found');

    proposal.status = ProposalStatus.REJECTED;
    await this.proposalRepo.save(proposal);

    const lead = await this.leadRepo.findOne({ where: { id: proposal.leadId } });
    if (lead) {
      lead.status = LeadState.CLOSED_LOST;
      await this.leadRepo.save(lead);
    }
    return { success: true, status: 'CLOSED_LOST' };
  }
}
