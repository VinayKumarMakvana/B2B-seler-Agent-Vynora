import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntentClassifierService, ProspectIntent } from './intent-classifier.service';
import { DraftGeneratorService } from './draft-generator.service';
import { Message, MessageDirection } from '../../crm/entities/message.entity';
import { Approval, ApprovalStatus } from '../../crm/entities/approval.entity';
import { Lead, LeadState } from '../../crm/entities/lead.entity';
import { Invoice, InvoiceStatus } from '../../delivery/entities/invoice.entity';
import { NotificationsGateway } from '../../notifications/notifications.gateway';
import * as fs from 'fs';
import * as path from 'path';

import { EmailService } from '../../integrations/email/email.service';

@Injectable()
export class ResponseOrchestratorService {
  private readonly logger = new Logger(ResponseOrchestratorService.name);

  constructor(
    private readonly intentClassifier: IntentClassifierService,
    private readonly draftGenerator: DraftGeneratorService,
    private readonly emailService: EmailService,
    @InjectRepository(Message) private messageRepo: Repository<Message>,
    @InjectRepository(Approval) private approvalRepo: Repository<Approval>,
    @InjectRepository(Lead) private leadRepo: Repository<Lead>,
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async processInboundWebhook(payload: any, idempotencyKey: string): Promise<void> {
    // 1. Identify Lead (Requires robust logic in production)
    // Here we use a fallback mock query assuming email is present
    const lead = await this.leadRepo.findOne({ 
      where: {}, 
      relations: { opportunity: true, company: true } 
    }); 
    if (!lead) {
      this.logger.warn(`Received webhook from unknown sender. IdempotencyKey: ${idempotencyKey}`);
      throw new BadRequestException('Lead not found for sender');
    }

    const content = payload.text || payload.body || '';
    const attachments = payload.attachments || [];

    // 2. Check for Payment Proof Attachment if Lead is in PROPOSAL_SENT state
    if (attachments.length > 0 && lead.status === LeadState.PROPOSAL_SENT) {
      this.logger.log(`Detected attachment from Lead ${lead.id} in PROPOSAL_SENT state. Processing as Payment Proof.`);
      
      const attachment = attachments[0]; // Assuming first attachment is the proof
      // In a real app, this would be uploaded to S3. Here we mock a local save if it's base64 or just use a dummy URL.
      const proofUrl = attachment.url || '/uploads/dummy_proof.png';
      
      const invoiceAmount = lead.opportunity?.valueUsd ? Number(lead.opportunity.valueUsd) : 30000.00;

      const invoice = this.invoiceRepo.create({
        leadId: lead.id,
        proposalId: lead.opportunity?.id || '00000000-0000-0000-0000-000000000000',
        amountUsd: invoiceAmount,
        status: InvoiceStatus.VERIFICATION_PENDING,
        proofUrl: proofUrl
      });
      await this.invoiceRepo.save(invoice);

      this.notificationsGateway.server.emit('PAYMENT_PROOF_RECEIVED', {
        leadId: lead.id,
        companyName: lead.company?.name || 'Unknown',
        method: 'email_attachment',
        proofUrl: proofUrl
      });
      
      // Early return: don't process this email as a conversational reply
      return;
    }

    // 2. Save incoming message
    const message = await this.messageRepo.save(this.messageRepo.create({
      lead,
      direction: MessageDirection.INBOUND,
      content,
      channel: 'email'
    }));

    // 3. Classify Intent
    const intent = await this.intentClassifier.classifyIntent(content);

    // 4. Update Lead State based on Intent
    let nextState = lead.status;
    if (intent === ProspectIntent.INTERESTED) nextState = LeadState.INTERESTED;
    else if (intent === ProspectIntent.MEETING_REQUEST) nextState = LeadState.MEETING_REQUESTED;
    else if (intent === ProspectIntent.NOT_INTERESTED) nextState = LeadState.NOT_INTERESTED;
    else if (intent === ProspectIntent.UNSUBSCRIBE) nextState = LeadState.UNSUBSCRIBE;
    
    if (nextState !== lead.status) {
      lead.status = nextState;
      await this.leadRepo.save(lead);
      this.logger.log(`Lead ${lead.id} transitioned to ${nextState}`);
    }

    // 5. Action Routing based on Intent
    if (intent === ProspectIntent.MEETING_REQUEST) {
      // Handoff: Meeting Details Required
      await this.approvalRepo.save(this.approvalRepo.create({
        entityType: 'message',
        entityId: message.id,
        requestedAction: 'provide_meeting_details',
        proposedContent: { clientMessage: content },
        aiReasoning: `Client requested a meeting. Human needs to provide time/link.`,
        status: ApprovalStatus.PENDING,
        riskLevel: 'medium'
      }));
      this.logger.log(`Created handoff approval: provide_meeting_details for Lead ${lead.id}`);
      
    } else if (intent === ProspectIntent.REQUIREMENTS_SHARED || intent === ProspectIntent.PRICING_REQUEST) {
      // Handoff: Proposal Details Required
      // Try to extract rough budget from text using simple regex or just pass text to human
      const roughBudget = content.match(/\\$?\\d{2,3}[kK]?|\\d+\\s*(?:dollars|usd)/i)?.[0] || 'Unknown';
      
      await this.approvalRepo.save(this.approvalRepo.create({
        entityType: 'message',
        entityId: message.id,
        requestedAction: 'provide_proposal',
        proposedContent: { clientMessage: content, extractedBudget: roughBudget },
        aiReasoning: `Client shared requirements/pricing request. Human needs to define Scope and Price.`,
        status: ApprovalStatus.PENDING,
        riskLevel: 'high'
      }));
      this.logger.log(`Created handoff approval: provide_proposal for Lead ${lead.id}`);
      
    } else {
      // Autonomous Execution for standard replies (INTERESTED, QUESTION, OBJECTION)
      const draftText = await this.draftGenerator.generateDraft(intent, content, {
        companyName: "Vynora", 
        leadState: lead.status,
        opportunityValueUsd: lead.opportunity?.valueUsd || 30000.00 
      });

      if (draftText && lead.contact?.email) {
        this.logger.log(`Autonomously replying to Lead ${lead.id} for intent: ${intent}`);
        try {
          // Assuming emailService is injected (need to inject it!)
          await this.emailService.sendEmail(lead.contact.email, `Re: Following up`, draftText);
        } catch (e) {
          this.logger.error(`Failed to auto-send reply to Lead ${lead.id}`, e);
        }
      } else {
        this.logger.warn(`Draft generation failed or no email for Lead ${lead.id}.`);
      }
    }
  }
}
