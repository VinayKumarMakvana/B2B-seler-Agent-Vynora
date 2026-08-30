import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OutreachOrchestratorService } from './outreach-orchestrator.service';
import { OutreachGeneratorService } from './outreach-generator.service';
import { Lead, LeadState } from '../../crm/entities/lead.entity';
import { Approval, ApprovalStatus } from '../../crm/entities/approval.entity';

import { vi } from 'vitest';

describe('OutreachOrchestratorService', () => {
  let service: OutreachOrchestratorService;
  
  const mockLeadRepo = {
    findOne: vi.fn(),
    save: vi.fn(),
  };
  
  const mockApprovalRepo = {
    create: vi.fn(),
    save: vi.fn(),
  };

  const mockGenerator = {
    generateHook: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutreachOrchestratorService,
        { provide: OutreachGeneratorService, useValue: mockGenerator },
        { provide: getRepositoryToken(Lead), useValue: mockLeadRepo },
        { provide: getRepositoryToken(Approval), useValue: mockApprovalRepo },
      ],
    }).compile();

    service = module.get<OutreachOrchestratorService>(OutreachOrchestratorService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should enforce Fail-Closed rule by creating PENDING approval instead of auto-sending', async () => {
    mockLeadRepo.findOne.mockResolvedValue({ id: '1', status: LeadState.NEW, priorityScore: 5 });
    mockGenerator.generateHook.mockResolvedValue('Hello there!');
    mockApprovalRepo.create.mockReturnValue({ id: 'a1' });

    await service.processLeadOutreach('1');

    expect(mockApprovalRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      status: ApprovalStatus.PENDING,
      riskLevel: 'high' // Flags cold outreach as high risk
    }));
    expect(mockApprovalRepo.save).toHaveBeenCalled();
  });

  it('should allow auto-send if priority score meets strict threshold', async () => {
    const lead = { id: '1', status: LeadState.NEW, priorityScore: 10 };
    mockLeadRepo.findOne.mockResolvedValue(lead);
    mockGenerator.generateHook.mockResolvedValue('High priority hello!');

    await service.processLeadOutreach('1');

    expect(mockApprovalRepo.save).not.toHaveBeenCalled();
    expect(lead.status).toBe(LeadState.CONTACTED); 
    expect(mockLeadRepo.save).toHaveBeenCalledWith(lead);
  });
});
