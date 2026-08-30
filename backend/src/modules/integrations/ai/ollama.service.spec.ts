import { Test, TestingModule } from '@nestjs/testing';
import { OllamaService, SYSTEM_SALES_PERSONA } from './ollama.service';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { z } from 'zod';
import { vi } from 'vitest';

describe('OllamaService Retry Logic', () => {
  let service: OllamaService;
  
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OllamaService,
        {
          provide: ConfigService,
          useValue: { get: vi.fn().mockReturnValue('http://localhost:11434') },
        },
      ],
    }).compile();

    service = module.get<OllamaService>(OllamaService);
    // Mock global fetch
    global.fetch = vi.fn();
  });

  it('should retry on invalid JSON and succeed on the second attempt', async () => {
    const schema = z.object({ success: z.boolean() });
    
    // Attempt 1: Return bad JSON
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'This is not JSON' })
      })
    // Attempt 2: Return good JSON
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: '{"success": true}' })
      });

    const result = await service.generateStructured('Test prompt', schema);
    
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ success: true });
  });

  it('should fail closed after max retries', async () => {
    const schema = z.object({ success: z.boolean() });
    
    // Always return bad JSON
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ response: 'Still bad JSON' })
    });

    await expect(service.generateStructured('Test', schema, 3)).rejects.toThrow(InternalServerErrorException);
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });
});
