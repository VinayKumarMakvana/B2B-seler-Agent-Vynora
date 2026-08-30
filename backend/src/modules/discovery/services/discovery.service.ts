import { Injectable, Logger } from '@nestjs/common';
import { DeduplicationService, DiscoveryCandidate } from './deduplication.service';
import { PriorityScoringService } from './priority-scoring.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../../crm/entities/company.entity';
import { Contact } from '../../crm/entities/contact.entity';
import { Lead, LeadState } from '../../crm/entities/lead.entity';

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);

  constructor(
    private readonly deduplicationService: DeduplicationService,
    private readonly priorityScoringService: PriorityScoringService,
    @InjectRepository(Company) private companyRepo: Repository<Company>,
    @InjectRepository(Contact) private contactRepo: Repository<Contact>,
    @InjectRepository(Lead) private leadRepo: Repository<Lead>,
  ) {}

  async runDiscovery(searchTerm: string, location: string): Promise<void> {
    this.logger.log(`Starting discovery for "${searchTerm}" in "${location}"`);
    
    // Fallback Sequence: Maps -> Web -> DuckDuckGo
    // Simulated mock until API keys are provided.
    const candidates = await this.mockFallbackSequence(searchTerm, location);

    for (const candidate of candidates) {
      const isDuplicate = await this.deduplicationService.isDuplicate(candidate);
      if (isDuplicate) {
        this.logger.log(`Candidate ${candidate.name} is a duplicate. Suppressing.`);
        continue;
      }

      const score = await this.priorityScoringService.scoreCandidate(candidate);

      const company = await this.companyRepo.save(this.companyRepo.create({
        name: candidate.name,
        domain: candidate.domain,
      }));

      let contact = null;
      if (candidate.email || candidate.phone) {
        contact = await this.contactRepo.save(this.contactRepo.create({
          company,
          name: 'General Contact', // Can be updated by AI parsing later
          email: candidate.email,
          phone: candidate.phone,
        }));
      }

      const lead = await this.leadRepo.save(this.leadRepo.create({
        company,
        contact: contact || undefined,
        status: LeadState.NEW,
        priorityScore: score,
        source: 'Discovery Engine',
      }));
      
      this.logger.log(`Created new CRM Lead: ${lead.id} with score ${score}`);
    }
  }

  private async mockFallbackSequence(searchTerm: string, location: string): Promise<DiscoveryCandidate[]> {
    // 1. In a real environment, integrate Google Places API, Clearbit, or LinkedIn.
    // 2. Here, we'll gracefully fallback to generating candidates dynamically based on the term
    // to simulate real integration rather than just hardcoding a static mock array.
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const domainPrefix = searchTerm.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    return [
      {
        name: `${searchTerm.trim()} Inc.`,
        domain: `${domainPrefix}.com`,
        email: `contact@${domainPrefix}.com`,
        source: 'Simulated Dynamic Discovery (Web)'
      },
      {
        name: `${searchTerm.trim()} (${location})`,
        domain: `${domainPrefix}local.net`,
        phone: '+1-555-0192',
        source: 'Simulated Dynamic Discovery (Maps)'
      }
    ];
  }
}
