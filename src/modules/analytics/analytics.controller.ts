import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';

@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard/stats')
  getDashboardStats() {
    return this.analyticsService.getDashboardStats();
  }

  @Get('analytics/completion')
  getCompletionRates(@Query('days') days = 30) {
    return this.analyticsService.getCompletionRates(days);
  }

  @Get('analytics/dropoff')
  getDropoffHeatmap() {
    return this.analyticsService.getDropoffHeatmap();
  }

  @Get('analytics/clicks')
  getClickStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getClickStats(startDate, endDate);
  }

  @Get('analytics/export/csv')
  async exportCsv(@Res() res: Response) {
    const csv = await this.analyticsService.exportAnalyticsCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=analytics.csv',
    );
    res.send(csv);
  }
}
