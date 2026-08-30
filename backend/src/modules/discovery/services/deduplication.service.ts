import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../../crm/entities/company.entity';
import { Contact } from '../../crm/entities/contact.entity';

export interface DiscoveryCandidate {
  name: string;
  domain?: string;
  email?: string;
  phone?: string;
  source: string;
}

@Injectable()
export class DeduplicationService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
  ) {}

  async isDuplicate(candidate: DiscoveryCandidate): Promise<boolean> {
    // 1. Check Domain (Strong identifier)
    if (candidate.domain) {
      const existingDomain = await this.companyRepository.findOne({ where: { domain: candidate.domain } });
      if (existingDomain) return true;
    }

    // 2. Check Email (Strong identifier)
    if (candidate.email) {
      const existingEmail = await this.contactRepository.findOne({ where: { email: candidate.email } });
      if (existingEmail) return true;
    }

    // 3. Check Phone (Strong identifier)
    if (candidate.phone) {
      const existingPhone = await this.contactRepository.findOne({ where: { phone: candidate.phone } });
      if (existingPhone) return true;
    }

    // Fail safe: If no strong identifiers match, it's not a duplicate.
    // Fuzzy matching on names is omitted to prevent accidental suppression of legitimate branches/franchises.
    return false;
  }
}
