import { Injectable, Logger } from '@nestjs/common';
import { OllamaService } from '../../integrations/ai/ollama.service';
import { z } from 'zod';

@Injectable()
export class FollowupGeneratorService {
  private readonly logger = new Logger(FollowupGeneratorService.name);

  constructor(private readonly ollamaService: OllamaService) {}

  async generateBump(leadContext: any, followUpNumber: number): Promise<string> {
    const prompt = `
      You are drafting a short follow-up (bump) email for Vynora to a prospect.
      This is follow-up #${followUpNumber}.
      
      PROSPECT CONTEXT:
      ${JSON.stringify(leadContext)}

      STRICT RULES (NO-INVENTION PRINCIPLE):
      1. Keep it under 2 sentences. Extremely concise.
      2. Do not invent facts, pricing, or timelines.
      3. Do not include placeholder brackets like [Your Name]. Just write the body text.
      4. Reference that you are bubbling this up to the top of their inbox.

      Return ONLY JSON: { "bumpText": "string" }
    `;

    const schema = z.object({
      bumpText: z.string(),
    });

    try {
      const result = await this.ollamaService.generateStructured<{bumpText: string}>(prompt, schema);
      return result.bumpText;
    } catch (error) {
      this.logger.error('Failed to generate follow-up bump', error);
      // Fallback to static template to ensure resilience and avoid silent drops
      return "Hi, just bubbling this to the top of your inbox. Let me know if you have a moment to connect."; 
    }
  }
}
