import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FollowupOrchestratorService } from './followup-orchestrator.service';
import { FollowupGeneratorService } from './followup-generator.service';
import { Lead, LeadState } from '../../crm/entities/lead.entity';
import { Approval } from '../../crm/entities/approval.entity';

import { vi } from 'vitest';

describe('FollowupOrchestratorService', () => {
  let service: FollowupOrchestratorService;
  
  const mockLeadRepo = {
    findOne: vi.fn(),
    save: vi.fn(),
    find: vi.fn(),
  };
  
  const mockApprovalRepo = {
    create: vi.fn(),
    save: vi.fn(),
  };

  const mockGenerator = {
    generateBump: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowupOrchestratorService,
        { provide: FollowupGeneratorService, useValue: mockGenerator },
        { provide: getRepositoryToken(Lead), useValue: mockLeadRepo },
        { provide: getRepositoryToken(Approval), useValue: mockApprovalRepo },
      ],
    }).compile();

    service = module.get<FollowupOrchestratorService>(FollowupOrchestratorService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should transition CONTACTED to FOLLOW_UP_1 and require manual approval (Fail Closed)', async () => {
    const lead = { id: '1', status: LeadState.CONTACTED };
    mockLeadRepo.findOne.mockResolvedValue(lead);
    mockGenerator.generateBump.mockResolvedValue('Bump 1');

    await service.processFollowUp('1');

    expect(lead.status).toBe(LeadState.FOLLOW_UP);
    expect(mockLeadRepo.save).toHaveBeenCalledWith(lead);
    expect(mockApprovalRepo.create).toHaveBeenCalled(); // Ensure it fails closed
    expect(mockGenerator.generateBump).toHaveBeenCalled(); // Should attempt AI
  });

  it('should enforce hard cap, suppress lead, and skip email generation', async () => {
    const lead = { id: '1', status: LeadState.FOLLOW_UP };
    mockLeadRepo.findOne.mockResolvedValue(lead);

    await service.processFollowUp('1');

    expect(lead.status).toBe(LeadState.SUPPRESSED);
    expect(mockLeadRepo.save).toHaveBeenCalledWith(lead);
    expect(mockApprovalRepo.create).not.toHaveBeenCalled(); // No more emails allowed!
    expect(mockGenerator.generateBump).not.toHaveBeenCalled(); // Saves AI compute
  });
});
