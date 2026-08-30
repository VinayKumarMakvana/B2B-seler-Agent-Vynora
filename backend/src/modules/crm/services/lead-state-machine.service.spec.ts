import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LeadStateMachineService } from './lead-state-machine.service';
import { Lead, LeadState } from '../entities/lead.entity';
import { BadRequestException } from '@nestjs/common';

import { vi } from 'vitest';

describe('LeadStateMachineService', () => {
  let service: LeadStateMachineService;
  let mockRepository = {
    findOne: vi.fn(),
    save: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadStateMachineService,
        {
          provide: getRepositoryToken(Lead),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<LeadStateMachineService>(LeadStateMachineService);
  });

  it('should allow valid transition from NEW to RESEARCHING', async () => {
    const lead = { id: '1', status: LeadState.NEW } as Lead;
    mockRepository.findOne.mockResolvedValue(lead);
    mockRepository.save.mockImplementation(async (l) => l);

    const result = await service.transition('1', LeadState.RESEARCHING, 'tester');
    expect(result.status).toBe(LeadState.RESEARCHING);
  });

  it('should block invalid transition from NEW to CONTACTED (Fail Closed)', async () => {
    const lead = { id: '1', status: LeadState.NEW } as Lead;
    mockRepository.findOne.mockResolvedValue(lead);

    await expect(service.transition('1', LeadState.CONTACTED, 'tester'))
      .rejects
      .toThrow(BadRequestException);
  });
});
