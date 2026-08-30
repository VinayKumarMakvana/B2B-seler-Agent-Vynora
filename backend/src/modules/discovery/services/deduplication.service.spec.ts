import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeduplicationService } from './deduplication.service';
import { Company } from '../../crm/entities/company.entity';
import { Contact } from '../../crm/entities/contact.entity';

import { vi } from 'vitest';

describe('DeduplicationService', () => {
  let service: DeduplicationService;

  const mockCompanyRepo = {
    findOne: vi.fn(),
  };
  
  const mockContactRepo = {
    findOne: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeduplicationService,
        { provide: getRepositoryToken(Company), useValue: mockCompanyRepo },
        { provide: getRepositoryToken(Contact), useValue: mockContactRepo },
      ],
    }).compile();

    service = module.get<DeduplicationService>(DeduplicationService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return true and prevent creation if domain already exists (Fail Closed)', async () => {
    mockCompanyRepo.findOne.mockResolvedValue({ id: '1', domain: 'example.com' });
    
    const result = await service.isDuplicate({
      name: 'Example LLC',
      domain: 'example.com',
      source: 'web'
    });

    expect(result).toBe(true);
    expect(mockCompanyRepo.findOne).toHaveBeenCalledWith({ where: { domain: 'example.com' } });
  });

  it('should return false if no strong identifiers match', async () => {
    mockCompanyRepo.findOne.mockResolvedValue(null);
    mockContactRepo.findOne.mockResolvedValue(null);

    const result = await service.isDuplicate({
      name: 'Unique LLC',
      domain: 'unique.com',
      source: 'web'
    });

    expect(result).toBe(false);
  });
});
