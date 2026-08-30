import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const host = this.configService.get<string>('SMTP_HOST') || 'localhost';
    const port = this.configService.get<number>('SMTP_PORT') || 1025;
    
    // For ports like 465, secure should be true. For 587/25, it's false.
    const secure = port === 465;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    try {
      const fromEmail = this.configService.get<string>('FROM_EMAIL') || '"Vynora BDM" <bdm@vynora.com>';
      const info = await this.transporter.sendMail({
        from: fromEmail,
        to,
        subject,
        text,
      });
      this.logger.log(`Message sent: ${info.messageId}`);
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      throw error;
    }
  }
}
