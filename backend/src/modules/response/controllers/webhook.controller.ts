import { Controller, Post, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { ResponseOrchestratorService } from '../services/response-orchestrator.service';

@Controller('api/v1/webhooks')
export class WebhookController {
  constructor(private readonly orchestrator: ResponseOrchestratorService) {}

  @Post('inbound-email')
  async handleInboundEmail(
    @Body() payload: any,
    @Headers('idempotency-key') idempotencyKey: string,
    @Headers('x-provider-signature') signature: string,
  ) {
    if (!signature) {
      // Fails closed if missing signature (Security Model requirement)
      throw new UnauthorizedException('Missing provider signature');
    }

    if (!idempotencyKey) {
      throw new UnauthorizedException('Idempotency key required');
    }

    // Cryptographic signature validation would happen here before processing.
    await this.orchestrator.processInboundWebhook(payload, idempotencyKey);
    return { status: 'processed' };
  }
}
