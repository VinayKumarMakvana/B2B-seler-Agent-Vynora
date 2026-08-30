import { Module } from '@nestjs/common';
import { OllamaService } from './ai/ollama.service';
import { TelegramNotificationService } from './notifications/telegram.service';
import { EmailService } from './email/email.service';
import { AiStateService } from './ai/ai-state.service';
import { AiController } from './ai/ai.controller';

@Module({
  controllers: [AiController],
  providers: [OllamaService, TelegramNotificationService, EmailService, AiStateService],
  exports: [OllamaService, TelegramNotificationService, EmailService, AiStateService],
})
export class IntegrationsModule {}
