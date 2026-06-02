import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats/summary')
  getSummary() {
    return this.dashboardService.getSummaryStats();
  }

  @Get('stats/distribution')
  getDistribution() {
    return this.dashboardService.getDataSourceDistribution();
  }

  @Get('stats/traffic')
  getTraffic() {
    return this.dashboardService.getTrafficData();
  }

  @Get('stats/performance')
  getPerformance() {
    return this.dashboardService.getPerformanceData();
  }

  @Post('save')
  saveLayout(@Body() body: { widgets: any; layout: any }) {
    return this.dashboardService.saveDashboardLayout(body.widgets, body.layout);
  }

  @Get('load')
  loadLayout() {
    return this.dashboardService.getDashboardLayout();
  }
}