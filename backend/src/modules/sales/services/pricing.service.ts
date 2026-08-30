import { Injectable, Logger } from '@nestjs/common';

export enum ProjectComplexity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  // Deterministic Base Rates (Configured for $500 minimum)
  private readonly BASE_RATE = 250;
  private readonly DURATION_RATE = 250;
  private readonly COMPLEXITY_MULTIPLIER = {
    [ProjectComplexity.LOW]: 1.0,
    [ProjectComplexity.MEDIUM]: 1.5,
    [ProjectComplexity.HIGH]: 2.5,
    [ProjectComplexity.CRITICAL]: 4.0
  };

  /**
   * Calculates price strictly based on code formulas.
   * AI has zero input or ability to mutate this result.
   */
  calculatePrice(complexity: ProjectComplexity, durationWeeks: number): number {
    const multiplier = this.COMPLEXITY_MULTIPLIER[complexity] || 1.0;
    
    if (durationWeeks <= 0) {
        throw new Error('Duration must be greater than 0');
    }

    // Strict Formula: Base * Multiplier + (DurationRate * weeks)
    const price = (this.BASE_RATE * multiplier) + (this.DURATION_RATE * durationWeeks);
    
    this.logger.log(`Calculated deterministic price: $${price} for Complexity: ${complexity}, Weeks: ${durationWeeks}`);
    return price;
  }
}
