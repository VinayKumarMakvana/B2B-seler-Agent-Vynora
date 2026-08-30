import { Controller, Get, Post, Param, Body, UseGuards, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Approval, ApprovalStatus } from '../entities/approval.entity';
import { Lead, LeadState } from '../entities/lead.entity';
import { Message, MessageDirection } from '../entities/message.entity';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles, Role } from '../../auth/roles.decorator';
import { EmailService } from '../../integrations/email/email.service';

@Controller('api/v1/approvals')
@UseGuards(RolesGuard)
export class ApprovalController {
  private readonly logger = new Logger(ApprovalController.name);

  constructor(
    @InjectRepository(Approval) private approvalRepo: Repository<Approval>,
    @InjectRepository(Lead) private leadRepo: Repository<Lead>,
    @InjectRepository(Message) private messageRepo: Repository<Message>,
    private readonly emailService: EmailService,
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
}
