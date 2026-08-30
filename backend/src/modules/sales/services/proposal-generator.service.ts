import { Injectable, Logger } from '@nestjs/common';
import { OllamaService } from '../../integrations/ai/ollama.service';
import { z } from 'zod';

@Injectable()
export class ProposalGeneratorService {
  private readonly logger = new Logger(ProposalGeneratorService.name);

  constructor(private readonly ollamaService: OllamaService) {}

  async draftScopeSummary(discoveryNotes: string): Promise<{ title: string, executiveSummary: string, deliverables: string[] }> {
    const prompt = `
      You are an elite B2B Sales Engineer drafting the scope for a proposal.
      
      DISCOVERY NOTES:
      ${discoveryNotes}

      STRICT RULES:
      1. DO NOT mention pricing, costs, or timelines. (No-Invention Principle)
      2. Summarize the core problem and the proposed technical solution.
      3. Provide a list of clear deliverables based ONLY on the notes provided.
      4. CRITICAL: Do NOT use filler intros like "In today's fast paced world". Go straight to the point.

      Return ONLY JSON matching the schema.
    `;

    const schema = z.object({
      title: z.string(),
      executiveSummary: z.string(),
      deliverables: z.array(z.string())
    });

    try {
      return await this.ollamaService.generateStructured(prompt, schema);
    } catch (error) {
      this.logger.error('Failed to generate proposal scope', error);
      throw new Error('AI Scope Generation Failed');
    }
  }

  async draftRevisedScope(originalScope: any, requestedChanges: string): Promise<{ title: string, executiveSummary: string, deliverables: string[] }> {
    const prompt = `
      You are an elite B2B Sales Engineer revising a proposal scope due to a lower budget constraint.
      
      ORIGINAL SCOPE:
      ${JSON.stringify(originalScope)}
      
      CLIENT REQUEST:
      ${requestedChanges}

      STRICT RULES:
      1. DO NOT mention pricing, costs, or timelines. (No-Invention Principle)
      2. The client wants a lower price. You MUST cut deliverables to meet the budget. Margin Protection rule is in effect.
      3. Rewrite the executive summary and list ONLY the remaining deliverables.

      Return ONLY JSON matching the schema.
    `;

    const schema = z.object({
      title: z.string(),
      executiveSummary: z.string(),
      deliverables: z.array(z.string())
    });

    try {
      return await this.ollamaService.generateStructured(prompt, schema);
    } catch (error) {
      this.logger.error('Failed to generate revised scope', error);
      throw new Error('AI Revised Scope Generation Failed');
    }
  }
}
