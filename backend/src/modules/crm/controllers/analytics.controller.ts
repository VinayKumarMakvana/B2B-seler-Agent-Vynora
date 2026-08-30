import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from '../entities/lead.entity';
import { Approval, ApprovalStatus } from '../entities/approval.entity';
import { Invoice } from '../../delivery/entities/invoice.entity';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles, Role } from '../../auth/roles.decorator';

@Controller('api/v1/analytics')
@UseGuards(RolesGuard)
export class AnalyticsController {
  constructor(
    @InjectRepository(Lead) private leadRepo: Repository<Lead>,
    @InjectRepository(Approval) private approvalRepo: Repository<Approval>,
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
  ) {}

  @Get('pipeline')
  @Roles(Role.OWNER, Role.ADMIN)
  async getPipelineAnalytics() {
    // 1. Group leads by status for the Funnel
    const leadsByStatus = await this.leadRepo
      .createQueryBuilder('lead')
      .select('lead.status', 'status')
      .addSelect('COUNT(lead.id)', 'count')
      .groupBy('lead.status')
      .getRawMany();

    const funnel = leadsByStatus.reduce((acc, curr) => {
      acc[curr.status] = parseInt(curr.count, 10);
      return acc;
    }, {});

    // 2. High-level KPIs
    const totalLeads = await this.leadRepo.count();
    const pendingApprovals = await this.approvalRepo.count({ where: { status: ApprovalStatus.PENDING } });
    const closedWon = funnel['closed_won'] || 0;
    const closedLost = funnel['closed_lost'] || 0;
    
    // Win Rate Calculation (Avoid division by zero)
    const totalClosed = closedWon + closedLost;
    const winRate = totalClosed > 0 ? ((closedWon / totalClosed) * 100).toFixed(1) + '%' : '0%';

    return {
      kpis: {
        totalLeads,
        pendingApprovals,
        closedWon,
        winRate,
      },
      funnel,
    };
  }

  @Get('target')
  @Roles(Role.OWNER, Role.ADMIN)
  async getTargetAnalytics() {
    // Calculate total paid this month vs $30,000 goal
    const result = await this.invoiceRepo
      .createQueryBuilder('invoice')
      .select('SUM(invoice.amountUsd)', 'total')
      .where("invoice.status = 'paid'")
      .getRawOne();
      
    const currentProfit = result.total ? parseFloat(result.total) : 0;
    const target = 30000;
    const progress = Math.min(currentProfit / target, 1);

    return {
      currentProfit,
      target,
      progress, // 0 to 1 scale for the graphical ring
      isMet: currentProfit >= target
    };
  }
}
