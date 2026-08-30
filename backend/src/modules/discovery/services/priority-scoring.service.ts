import { Injectable, Logger } from '@nestjs/common';
import { OllamaService } from '../../integrations/ai/ollama.service';
import { z } from 'zod';

@Injectable()
export class PriorityScoringService {
  private readonly logger = new Logger(PriorityScoringService.name);

  constructor(private readonly ollamaService: OllamaService) {}

  async scoreCandidate(businessInfo: any): Promise<number> {
    const prompt = `
      Evaluate this business for B2B services (e.g. software development, automation).
      Business Info: ${JSON.stringify(businessInfo)}
      Score from 1 to 10 where 10 means highly likely to need services (e.g. outdated website, clear technical needs) 
      and 1 means definitely does not need services.
      Return JSON exactly as: { "score": number, "reason": "string" }
    `;

    const schema = z.object({
      score: z.number().min(1).max(10),
      reason: z.string(),
    });

    try {
      const result = await this.ollamaService.generateStructured<{score: number, reason: string}>(prompt, schema);
      this.logger.log(`Priority Score: ${result.score} - ${result.reason}`);
      return result.score;
    } catch (error) {
      this.logger.warn('Failed to generate priority score, defaulting to 5', error);
      return 5; // Safe fallback
    }
  }
}
