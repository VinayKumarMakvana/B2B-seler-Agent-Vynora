import { Controller, Get, Post, Body } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Directive } from '../entities/directive.entity';

@Controller('directives')
export class DirectiveController {
  constructor(
    @InjectRepository(Directive)
    private readonly directiveRepo: Repository<Directive>,
  ) {}

  @Get()
  async getDirectives() {
    return this.directiveRepo.find({ order: { createdAt: 'ASC' } });
  }

  @Post()
  async addDirective(@Body() data: { content: string }) {
    // 1. Save User's Directive
    const userMsg = this.directiveRepo.create({ content: data.content, role: 'user' });
    await this.directiveRepo.save(userMsg);

    // 2. Simulate AI Processing and Save AI's response
    const aiMsg = this.directiveRepo.create({ 
      content: 'Understood. I have updated my global parameters based on your directives.',
      role: 'ai'
    });
    
    // Slight delay for realism in chat
    setTimeout(async () => {
      await this.directiveRepo.save(aiMsg);
    }, 1000);

    return userMsg;
  }
}
