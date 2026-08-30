import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramNotificationService {
  private readonly logger = new Logger(TelegramNotificationService.name);
  private readonly botToken: string;
  private readonly ownerId: string;

  constructor(private readonly configService: ConfigService) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN') || '';
    this.ownerId = this.configService.get<string>('TELEGRAM_ADMIN_USER_ID') || '';
  }

  async sendOwnerNotification(message: string): Promise<boolean> {
    if (!this.botToken || !this.ownerId) {
      this.logger.warn('Telegram credentials not configured. Skipping notification.');
      return false;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.ownerId,
          text: message,
          parse_mode: 'MarkdownV2',
        }),
      });
      return response.ok;
    } catch (error) {
      this.logger.error('Failed to send Telegram notification', error);
      return false; // Fail closed, but don't crash the calling job
    }
  }
}
