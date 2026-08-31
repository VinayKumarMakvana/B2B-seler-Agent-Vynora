import { Controller, Get, Post, Param, Body, UseGuards, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Approval, ApprovalStatus } from '../entities/approval.entity';
import { Lead, LeadState } from '../entities/lead.entity';
import { Message, MessageDirection } from '../entities/message.entity';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles, Role } from '../../auth/roles.decorator';
import { EmailService } from '../../integrations/email/email.service';
import { OllamaService } from '../../integrations/ai/ollama.service';

@Controller('api/v1/approvals')
@UseGuards(RolesGuard)
export class ApprovalController {
  private readonly logger = new Logger(ApprovalController.name);

  constructor(
    @InjectRepository(Approval) private approvalRepo: Repository<Approval>,
    @InjectRepository(Lead) private leadRepo: Repository<Lead>,
    @InjectRepository(Message) private messageRepo: Repository<Message>,
    private readonly emailService: EmailService,
    private readonly ollamaService: OllamaService,
  ) {}

  @Get()
  @Roles(Role.OWNER, Role.ADMIN)
  async getPendingApprovals() {
    return this.approvalRepo.find({
      where: { status: ApprovalStatus.PENDING },
      order: { createdAt: 'DESC' }
    });
  }

  @Post(':id/approve')
  @Roles(Role.OWNER, Role.ADMIN)
  async approve(@Param('id') id: string) {
    const approval = await this.approvalRepo.findOne({ where: { id } });
    if (!approval) throw new NotFoundException('Approval not found');
    if (approval.status !== ApprovalStatus.PENDING) throw new BadRequestException('Approval is not pending');

    approval.status = ApprovalStatus.APPROVED;
    approval.approvedBy = 'system_owner'; // Hardcoded for demo, normally from req.user
    await this.approvalRepo.save(approval);

    if (approval.entityType === 'lead_outreach' || approval.entityType === 'lead_followup') {
      const lead = await this.leadRepo.findOne({ 
        where: { id: approval.entityId },
        relations: { contact: true, company: true } 
      });
      
      if (lead && lead.contact && lead.contact.email) {
        const subject = approval.entityType === 'lead_outreach' 
          ? `Exploring synergies with ${lead.company?.name || 'your team'}`
          : `Following up on my previous email`;
          
        const bodyText = approval.proposedContent.hookText 
          || approval.proposedContent.bumpText 
          || JSON.stringify(approval.proposedContent);

        try {
          // Dispatch physical email via SMTP
          await this.emailService.sendEmail(lead.contact.email, subject, bodyText);

          // Log in CRM messages table
          const msg = this.messageRepo.create({
            lead: lead,
            direction: MessageDirection.OUTBOUND,
            content: bodyText,
            channel: 'email',
          });
          await this.messageRepo.save(msg);

          this.logger.log(`Dispatched ${approval.entityType} email to ${lead.contact.email}`);
        } catch (e: any) {
          this.logger.error(`Failed to dispatch email for approval ${approval.id}: ${e.message}`);
        }
      }
      
      // Update state for outreach
      if (lead && approval.entityType === 'lead_outreach') {
        lead.status = LeadState.CONTACTED;
        await this.leadRepo.save(lead);
      }
    }

    return { status: 'approved', approval };
  }

  @Post(':id/reject')
  @Roles(Role.OWNER, Role.ADMIN)
  async reject(@Param('id') id: string, @Body('reason') reason?: string) {
    const approval = await this.approvalRepo.findOne({ where: { id } });
    if (!approval) throw new NotFoundException('Approval not found');
    if (approval.status !== ApprovalStatus.PENDING) throw new BadRequestException('Approval is not pending');

    approval.status = ApprovalStatus.REJECTED;
    // Log reason if provided...
    
    await this.approvalRepo.save(approval);
    return { status: 'rejected', approval };
  }

  @Post(':id/execute-action')
  @Roles(Role.OWNER, Role.ADMIN)
  async executeAction(@Param('id') id: string, @Body() payload: any) {
    const approval = await this.approvalRepo.findOne({ where: { id } });
    if (!approval) throw new NotFoundException('Approval not found');
    if (approval.status !== ApprovalStatus.PENDING) throw new BadRequestException('Approval is not pending');

    const lead = await this.leadRepo.findOne({ 
      where: { id: approval.entityId },
      relations: { contact: true, company: true } 
    });

    if (!lead || !lead.contact?.email) {
      throw new BadRequestException('Lead or contact email not found');
    }

    // Agentic formatting of raw data
    const prompt = `
      You are an Elite B2B Consultative Sales Director.
      Your manager has provided the following raw notes to reply to a prospect.
      Turn these rough notes into a highly professional, concise, and persuasive email.
      Do not invent features or prices. Do not use generic openers.
      
      Action Required: ${approval.requestedAction}
      Prospect Message: "${approval.proposedContent?.clientMessage || 'N/A'}"
      Manager's Raw Notes: ${JSON.stringify(payload)}
      
      Respond with ONLY the final email body.
    `;

    try {
      const finalEmailBody = await this.ollamaService.generateText(prompt);

      const subject = approval.requestedAction === 'provide_meeting_details'
        ? `Meeting Details - ${lead.company?.name || 'Vynora'}`
        : `Proposal for ${lead.company?.name || 'Vynora'}`;

      await this.emailService.sendEmail(lead.contact.email, subject, finalEmailBody);

      // Log in CRM messages table
      await this.messageRepo.save(this.messageRepo.create({
        lead: lead,
        direction: MessageDirection.OUTBOUND,
        content: finalEmailBody,
        channel: 'email',
      }));

      // If it was a proposal, update lead state
      if (approval.requestedAction === 'provide_proposal') {
        lead.status = LeadState.PROPOSAL_SENT;
        await this.leadRepo.save(lead);
      }

      approval.status = ApprovalStatus.APPROVED;
      approval.approvedBy = 'system_owner';
      await this.approvalRepo.save(approval);

      this.logger.log(`Agent executed action ${approval.requestedAction} and sent formatted email to ${lead.contact.email}`);
      return { status: 'executed', emailSent: true };
    } catch (e: any) {
      this.logger.error(`Failed to execute action for approval ${approval.id}`, e);
      throw new BadRequestException('Failed to format and send email: ' + e.message);
    }
  }
}
