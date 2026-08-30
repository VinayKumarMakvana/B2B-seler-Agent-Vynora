import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead, LeadState } from '../entities/lead.entity';

@Injectable()
export class LeadStateMachineService {
  constructor(
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
  ) {}

  private readonly allowedTransitions: Record<LeadState, LeadState[]> = {
    [LeadState.NEW]: [LeadState.RESEARCHING],
    [LeadState.RESEARCHING]: [LeadState.QUALIFIED, LeadState.SUPPRESSED],
    [LeadState.QUALIFIED]: [LeadState.OUTREACH_READY],
    [LeadState.OUTREACH_READY]: [LeadState.CONTACTED],
    [LeadState.CONTACTED]: [LeadState.AWAITING_RESPONSE],
    [LeadState.AWAITING_RESPONSE]: [LeadState.FOLLOW_UP, LeadState.INTERESTED, LeadState.NOT_INTERESTED],
    [LeadState.FOLLOW_UP]: [LeadState.AWAITING_RESPONSE],
    [LeadState.INTERESTED]: [LeadState.MEETING_REQUESTED],
    [LeadState.NOT_INTERESTED]: [LeadState.NURTURE, LeadState.SUPPRESSED],
    [LeadState.MEETING_REQUESTED]: [LeadState.MEETING_SCHEDULED],
    [LeadState.MEETING_SCHEDULED]: [LeadState.DISCOVERY_COMPLETE],
    [LeadState.DISCOVERY_COMPLETE]: [LeadState.PROPOSAL_PENDING],
    [LeadState.PROPOSAL_PENDING]: [LeadState.PROPOSAL_SENT],
    [LeadState.PROPOSAL_SENT]: [LeadState.DECISION_PENDING],
    [LeadState.DECISION_PENDING]: [LeadState.NEGOTIATION, LeadState.CLOSED_WON, LeadState.CLOSED_LOST, LeadState.EXPIRED],
    [LeadState.NEGOTIATION]: [LeadState.PROPOSAL_SENT, LeadState.CLOSED_LOST],
    [LeadState.CLOSED_WON]: [],
    [LeadState.CLOSED_LOST]: [],
    [LeadState.EXPIRED]: [LeadState.NURTURE],
    [LeadState.NURTURE]: [LeadState.OUTREACH_READY],
    [LeadState.SUPPRESSED]: [],
    [LeadState.UNSUBSCRIBE]: [],
  };

  async transition(leadId: string, targetState: LeadState, actor: string, reason?: string): Promise<Lead> {
    const lead = await this.leadRepository.findOne({ where: { id: leadId } });
    if (!lead) {
      throw new BadRequestException('Lead not found');
    }

    const currentTransitions = this.allowedTransitions[lead.status];
    if (!currentTransitions || !currentTransitions.includes(targetState)) {
      throw new BadRequestException(`Cannot transition Lead from ${lead.status} to ${targetState}`);
    }

    lead.status = targetState;
    // Log transition event to AuditLogs in the future
    return this.leadRepository.save(lead);
  }
}
