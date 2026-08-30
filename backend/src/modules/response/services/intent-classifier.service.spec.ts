import { Test, TestingModule } from '@nestjs/testing';
import { IntentClassifierService, ProspectIntent } from './intent-classifier.service';
import { OllamaService } from '../../integrations/ai/ollama.service';

import { vi } from 'vitest';

describe('IntentClassifierService', () => {
  let service: IntentClassifierService;
  let mockOllamaService = {
    generateStructured: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntentClassifierService,
        { provide: OllamaService, useValue: mockOllamaService },
      ],
    }).compile();

    service = module.get<IntentClassifierService>(IntentClassifierService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should map valid AI response to ProspectIntent', async () => {
    mockOllamaService.generateStructured.mockResolvedValue({ intent: ProspectIntent.PRICING_REQUEST });
    
    const result = await service.classifyIntent('How much does this cost?');
    expect(result).toBe(ProspectIntent.PRICING_REQUEST);
  });

  it('should fallback to UNCLEAR on AI failure (Fail Safe)', async () => {
    mockOllamaService.generateStructured.mockRejectedValue(new Error('AI failed'));

    const result = await service.classifyIntent('Random unparseable string');
    expect(result).toBe(ProspectIntent.UNCLEAR);
  });
});
