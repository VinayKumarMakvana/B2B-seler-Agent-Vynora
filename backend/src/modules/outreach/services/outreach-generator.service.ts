import { Injectable, Logger } from '@nestjs/common';
import { OllamaService } from '../../integrations/ai/ollama.service';
import { z } from 'zod';

@Injectable()
export class OutreachGeneratorService {
  private readonly logger = new Logger(OutreachGeneratorService.name);

  constructor(private readonly ollamaService: OllamaService) {}

  async generateHook(leadContext: any): Promise<string> {
    const prompt = `
      You are drafting an initial outbound cold email for Vynora to a prospect.
      
      PROSPECT CONTEXT:
      ${JSON.stringify(leadContext)}

      STRICT RULES (NO-INVENTION PRINCIPLE):
      1. Keep it extremely concise and focused on starting a conversation.
      2. Do not invent facts, pricing, or timelines.
      3. Highlight a potential pain point related to their industry.
      4. End with a soft call to action.

      ONE-SHOT EXAMPLE (GOOD):
      {
        "hookText": "Hi, I noticed your team is scaling infrastructure. Often, this leads to brittle pipelines that require manual intervention. We recently helped a firm in your sector automate this, saving 20 hours a week. Would you be open to a brief chat to see if we could do the same for you?"
      }
      
      Return ONLY valid JSON matching the schema: { "hookText": "string" }
    `;

    const schema = z.object({
      hookText: z.string(),
    });

    try {
      const result = await this.ollamaService.generateStructured<{hookText: string}>(prompt, schema);
      return result.hookText;
    } catch (error) {
      this.logger.error('Failed to generate outreach hook (No-Invention safeguard triggered)', error);
      return ''; // Empty hook requires manual intervention
    }
  }
}
