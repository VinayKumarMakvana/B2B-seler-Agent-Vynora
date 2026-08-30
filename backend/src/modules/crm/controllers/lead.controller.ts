import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeadStateMachineService } from '../services/lead-state-machine.service';
import { Lead, LeadState } from '../entities/lead.entity';
import { Opportunity } from '../entities/opportunity.entity';
import { Company } from '../entities/company.entity';
import { Contact } from '../entities/contact.entity';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles, Role } from '../../auth/roles.decorator';

@Controller('api/v1/leads')
@UseGuards(RolesGuard)
export class LeadController {
  constructor(
    private readonly leadStateMachineService: LeadStateMachineService,
    @InjectRepository(Lead) private leadRepo: Repository<Lead>,
    @InjectRepository(Opportunity) private oppRepo: Repository<Opportunity>,
    @InjectRepository(Company) private companyRepo: Repository<Company>,
    @InjectRepository(Contact) private contactRepo: Repository<Contact>,
  ) {}

  @Get()
  @Roles(Role.OWNER, Role.ADMIN, Role.BDM, Role.JR_BDM)
  async getAllLeads(@Req() req: any) {
    const user = req.user;
    
    if (user?.role === Role.JR_BDM) {
      return this.leadRepo.find({
        where: { assignedTo: { id: user.sub } },
        relations: { company: true, contact: true, opportunity: true, assignedTo: true },
        order: { createdAt: 'DESC' }
      });
    }

    return this.leadRepo.find({
      relations: { company: true, contact: true, opportunity: true, assignedTo: true },
      order: { createdAt: 'DESC' }
    });
  }

  @Get(':id/pitch')
  async getPitchData(@Param('id') leadId: string) {
    return this.leadRepo.findOne({
      where: { id: leadId },
      relations: { company: true, opportunity: true }
    });
  }

  @Post()
  @Roles(Role.OWNER, Role.BDM, Role.SYSTEM)
  async createLead(@Body() body: any) {
    const { companyName, contactName, contactEmail, projectRequirements } = body;
    
    let company = await this.companyRepo.save(this.companyRepo.create({
      name: companyName,
      domain: contactEmail.split('@')[1] || 'unknown.com'
    }));

    let contact = await this.contactRepo.save(this.contactRepo.create({
      name: contactName,
      email: contactEmail,
      role: 'Client',
      company
    }));

    let lead = await this.leadRepo.save(this.leadRepo.create({
      company,
      contact,
      status: LeadState.NEW,
      source: 'Manual Input'
    }));

    if (projectRequirements) {
      await this.oppRepo.save(this.oppRepo.create({
        lead,
        projectRequirements,
        status: 'open' as any
      }));
    }

    return lead;
  }

  @Post(':id/transition')
  @Roles(Role.OWNER, Role.BDM, Role.SYSTEM)
  async transitionLeadState(
    @Param('id') leadId: string,
    @Body('targetState') targetState: LeadState,
    @Body('reason') reason: string,
  ) {
    const actor = 'api_user'; 
    return this.leadStateMachineService.transition(leadId, targetState, actor, reason);
  }

  @Post(':id/requirements')
  @Roles(Role.OWNER, Role.BDM, Role.SYSTEM)
  async updateRequirements(
    @Param('id') leadId: string,
    @Body('requirements') requirements: string,
  ) {
    let opp = await this.oppRepo.findOne({ where: { lead: { id: leadId } } });
    if (!opp) {
      opp = this.oppRepo.create({ lead: { id: leadId } as any, projectRequirements: requirements });
    } else {
      opp.projectRequirements = requirements;
    }
    await this.oppRepo.save(opp);
    return { success: true, projectRequirements: requirements };
  }
}
