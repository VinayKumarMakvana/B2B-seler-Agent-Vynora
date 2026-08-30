import { Injectable, Logger } from '@nestjs/common';
import { OllamaService } from '../../integrations/ai/ollama.service';
import { z } from 'zod';

export enum ProspectIntent {
  INTERESTED = 'interested',
  QUESTION = 'question',
  OBJECTION = 'objection',
  PRICING_REQUEST = 'pricing_request',
  MEETING_REQUEST = 'meeting_request',
  REQUIREMENTS_SHARED = 'requirements_shared',
  POSITIVE_GENERAL = 'positive_general',
  NOT_INTERESTED = 'not_interested',
  UNSUBSCRIBE = 'unsubscribe',
  LATER = 'later',
  UNCLEAR = 'unclear',
  OUT_OF_OFFICE = 'out_of_office',
  WRONG_CONTACT = 'wrong_contact',
  REFERRAL = 'referral',
}

@Injectable()
export class IntentClassifierService {
  private readonly logger = new Logger(IntentClassifierService.name);

  constructor(private readonly ollamaService: OllamaService) {}

  async classifyIntent(messageContent: string): Promise<ProspectIntent> {
    const prompt = `
      Classify the intent of the following prospect message into exactly one of these categories:
      ${Object.values(ProspectIntent).join(', ')}

      Message: "${messageContent}"

      Respond only with JSON: { "intent": "category_name" }
    `;

    const schema = z.object({
      intent: z.nativeEnum(ProspectIntent),
    });

    try {
      const result = await this.ollamaService.generateStructured<{intent: ProspectIntent}>(prompt, schema);
      this.logger.log(`Classified intent as: ${result.intent}`);
      return result.intent;
    } catch (error) {
      // Fail closed / Fail safe: If AI fails, we must flag it as UNCLEAR to force human review
      this.logger.warn('Failed to cleanly classify intent, defaulting to UNCLEAR', error);
      return ProspectIntent.UNCLEAR; 
    }
  }
}
