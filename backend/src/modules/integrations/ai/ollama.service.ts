import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const SYSTEM_SALES_PERSONA = `
SYSTEM INSTRUCTION:
You are an Elite B2B Consultative Sales Director for Vynora.
Your tone is professional, authoritative, and consultative.
DO NOT use generic AI filler words (e.g., "I hope this email finds you well", "In today's fast paced world", "In conclusion").
Always respond in strict JSON format.
`;

import { AiStateService } from './ai-state.service';

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly aiState: AiStateService,
  ) {
    this.baseUrl = this.configService.get<string>('OLLAMA_BASE_URL') || 'http://localhost:11434';
    this.model = this.configService.get<string>('OLLAMA_MODEL') || 'qwen3:4b';
  }

  async generateStructured<T>(prompt: string, schema: any, maxRetries = 3): Promise<T> {
    if (!this.aiState.isAgentRunning) {
      throw new InternalServerErrorException('AI Agent is currently STOPPED.');
    }

    this.aiState.setTask('Analyzing data and generating structured response...');
    
    const fullPrompt = `${SYSTEM_SALES_PERSONA}\n\n${prompt}\n\nRespond ONLY in valid JSON.`;
    let attempt = 0;

    while (attempt < maxRetries) {
      attempt++;
      try {
        let useGeminiFallback = false;
        let responseJsonStr = '';

        if (this.aiState.model === 'ollama') {
          try {
            const res = await fetch(`${this.baseUrl}/api/generate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: this.model,
                prompt: fullPrompt,
                stream: false,
                format: 'json',
              }),
              signal: AbortSignal.timeout(5000),
            });

            if (!res.ok) throw new Error(`Ollama API failed: ${res.statusText}`);
            const data = await res.json();
            responseJsonStr = data.response;
          } catch (err: any) {
            this.logger.warn(`Ollama failed (${err.message}). Auto-switching to Gemini!`);
            this.aiState.setModel('gemini');
            useGeminiFallback = true;
          }
        }

        if (this.aiState.model === 'gemini' || useGeminiFallback) {
          const apiKey = this.configService.get<string>('GEMINI_API_KEY');
          if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fullPrompt }] }],
              generationConfig: { response_mime_type: 'application/json' }
            }),
            signal: AbortSignal.timeout(10000),
          });

          if (!res.ok) throw new Error(`Gemini API failed: ${res.statusText}`);
          const data = await res.json();
          responseJsonStr = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
        
        let parsedContent;
        try {
          parsedContent = JSON.parse(responseJsonStr);
        } catch(e) {
          throw new Error('Invalid JSON string returned from AI');
        }
        
        const result = schema.parse(parsedContent);
        this.aiState.clearTask();
        return result;
      } catch (error: any) {
        this.logger.warn(`AI Extraction Failed on attempt ${attempt} (${this.aiState.model}). Error: ${error.message}`);
        
        if (attempt >= maxRetries) {
          this.aiState.clearTask();
          this.logger.error('AI Extraction Failed (Fail Closed) after max retries.', error);
          throw new InternalServerErrorException('AI Output Invalid or Unparseable after retries');
        }
      }
    }
    
    this.aiState.clearTask();
    throw new InternalServerErrorException('AI Output Invalid');
  }
}
