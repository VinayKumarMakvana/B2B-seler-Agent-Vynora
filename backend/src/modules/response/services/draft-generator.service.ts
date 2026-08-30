import { Injectable, Logger } from '@nestjs/common';
import { OllamaService } from '../../integrations/ai/ollama.service';
import { z } from 'zod';
import { ProspectIntent } from './intent-classifier.service';

@Injectable()
export class DraftGeneratorService {
  private readonly logger = new Logger(DraftGeneratorService.name);

  constructor(private readonly ollamaService: OllamaService) {}

  async generateDraft(intent: ProspectIntent, messageContent: string, context: any): Promise<string> {
    const prompt = `
      You are drafting a response to a prospect for Vynora.
      
      PROSPECT MESSAGE:
      "${messageContent}"

      CLASSIFIED INTENT: ${intent}

      KNOWN CONTEXT:
      ${JSON.stringify(context)}

      STRICT 10-YEAR VETERAN BDM PERSONA RULES:
      1. Role: You are an elite Business Development Manager and Sales Closer with 10+ years of experience in high-ticket tech sales. You do NOT sound like an AI. You are confident, consultative, empathetic, and authoritative.
      2. Consultative Discovery: If requirements are vague, do not interrogate. Instead, ask high-value, strategic questions (e.g., "To ensure we build something that actually drives ROI for you, could you share the core bottleneck you're trying to solve?").
      3. Value-Selling & Budget: Don't just ask for a budget; anchor it to value. (e.g., "To ensure our proposed architecture aligns with your financial expectations, do you have a specific budget range earmarked for this initiative?").
      4. Price Deferral (The BDM Stance): If they ask for price prematurely, NEVER throw a number. Say: "I don't believe in giving generic quotes. I'll have my engineering team analyze your specific requirements and put together a tailored proposal with exact pricing and timelines. I will get back to you shortly."
      5. Psychological Mirroring: Match their tone. If they are brief, be concise. If they are detailed, be comprehensive.
      6. No Invention: Never invent pricing, timelines, URLs, or guarantees. Rely strictly on facts.
      7. Closing (PROPOSAL_SENT): If LEAD STATE is "PROPOSAL_SENT" and INTENT is "INTERESTED", append this exact instruction:
         "To initiate the project, please transfer the $\${context.opportunityValueUsd} USD via Binance Pay (ID: 283749201) or PayPal (billing@vynora.com). Please reply directly to this email with a screenshot of the transfer so we can immediately hand off your project to our engineering team."

      Draft the exact email body text. Return ONLY JSON: { "draftText": "string" }
    `;

    const schema = z.object({
      draftText: z.string(),
    });

    try {
      const result = await this.ollamaService.generateStructured<{draftText: string}>(prompt, schema);
      return result.draftText;
    } catch (error) {
      this.logger.error('Failed to generate draft text (No-Invention safeguard triggered)', error);
      return ''; // Empty draft requires manual fallback
    }
  }
}
