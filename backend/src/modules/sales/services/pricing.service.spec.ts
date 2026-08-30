import { Test, TestingModule } from '@nestjs/testing';
import { PricingService, ProjectComplexity } from './pricing.service';

describe('PricingService Determinism', () => {
  let service: PricingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PricingService],
    }).compile();

    service = module.get<PricingService>(PricingService);
  });

  it('should calculate base price deterministically for LOW complexity', () => {
    // LOW (1.0) * 250 + (250 * 2 weeks) = 250 + 500 = 750
    const price = service.calculatePrice(ProjectComplexity.LOW, 2);
    expect(price).toBe(750);
  });

  it('should calculate base price deterministically for CRITICAL complexity', () => {
    // CRITICAL (4.0) * 250 + (250 * 4 weeks) = 1000 + 1000 = 2000
    const price = service.calculatePrice(ProjectComplexity.CRITICAL, 4);
    expect(price).toBe(2000);
  });

  it('should throw an error for negative or zero duration', () => {
    expect(() => service.calculatePrice(ProjectComplexity.MEDIUM, 0)).toThrowError();
  });
});
