import { Controller, Get, Post, Body } from '@nestjs/common';
import { AiStateService, AiModel } from './ai-state.service';

@Controller('agent')
export class AiController {
  constructor(private readonly aiStateService: AiStateService) {}

  @Get('status')
  getStatus() {
    return this.aiStateService.getState();
  }

  @Post('toggle')
  toggleAgent(@Body('isRunning') isRunning: boolean) {
    this.aiStateService.setRunning(isRunning);
    return this.aiStateService.getState();
  }

  @Post('model')
  switchModel(@Body('model') model: AiModel) {
    this.aiStateService.setModel(model);
    return this.aiStateService.getState();
  }
}
