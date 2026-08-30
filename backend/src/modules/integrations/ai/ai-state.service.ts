import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';

export type AiModel = 'ollama' | 'gemini';

@Injectable()
export class AiStateService {
  private readonly logger = new Logger(AiStateService.name);
  
  private isRunning: boolean = true;
  private activeModel: AiModel = 'ollama';
  private currentTask: string = 'Idle';

  // Observable for SSE if needed, or simple polling
  public readonly state$ = new Subject<any>();

  public getState() {
    return {
      isRunning: this.isRunning,
      activeModel: this.activeModel,
      currentTask: this.currentTask,
    };
  }

  public setRunning(running: boolean) {
    this.isRunning = running;
    if (!running) this.currentTask = 'Stopped';
    else this.currentTask = 'Idle';
    this.logger.log(`Agent is now ${running ? 'RUNNING' : 'STOPPED'}`);
    this.broadcast();
  }

  public setModel(model: AiModel) {
    this.activeModel = model;
    this.logger.log(`Agent model switched to ${model}`);
    this.broadcast();
  }

  public setTask(task: string) {
    if (this.isRunning) {
      this.currentTask = task;
      this.broadcast();
    }
  }

  public clearTask() {
    if (this.isRunning) {
      this.currentTask = 'Idle';
      this.broadcast();
    }
  }

  public get isAgentRunning() {
    return this.isRunning;
  }

  public get model() {
    return this.activeModel;
  }

  private broadcast() {
    this.state$.next(this.getState());
  }
}
