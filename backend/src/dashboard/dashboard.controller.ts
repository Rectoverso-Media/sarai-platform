import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { GenerateShareTokenDto } from './dto/generate-share-token.dto';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // =============================================
  // STATS (tidak butuh auth agar bisa diakses dari shared page)
  // =============================================

  @Get('stats/summary')
  @UseGuards(AuthGuard('jwt'))
  getSummary() {
    return this.dashboardService.getSummaryStats();
  }

  @Get('stats/distribution')
  @UseGuards(AuthGuard('jwt'))
  getDistribution() {
    return this.dashboardService.getDataSourceDistribution();
  }

  @Get('stats/traffic')
  @UseGuards(AuthGuard('jwt'))
  getTraffic() {
    return this.dashboardService.getTrafficData();
  }

  @Get('stats/performance')
  @UseGuards(AuthGuard('jwt'))
  getPerformance() {
    return this.dashboardService.getPerformanceData();
  }

  // =============================================
  // DASHBOARD CRUD — Semua butuh Auth
  // =============================================

  /** POST /dashboard — Buat dashboard baru */
  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Body() dto: CreateDashboardDto, @Req() req: any) {
    const teamId = req.user?.teamId ?? req.user?.id;
    return this.dashboardService.createDashboard(teamId, dto);
  }

  /** GET /dashboard — List semua dashboard team */
  @Get()
  @UseGuards(AuthGuard('jwt'))
  list(@Req() req: any) {
    const teamId = req.user?.teamId ?? req.user?.id;
    return this.dashboardService.listDashboards(teamId);
  }

  /** GET /dashboard/:id — Ambil satu dashboard */
  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  getOne(@Param('id') id: string, @Req() req: any) {
    const teamId = req.user?.teamId ?? req.user?.id;
    return this.dashboardService.getDashboard(id, teamId);
  }

  /** PUT /dashboard/:id — Update dashboard */
  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDashboardDto,
    @Req() req: any,
  ) {
    const teamId = req.user?.teamId ?? req.user?.id;
    return this.dashboardService.updateDashboard(id, teamId, dto);
  }

  /** DELETE /dashboard/:id — Hapus dashboard */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @Req() req: any) {
    const teamId = req.user?.teamId ?? req.user?.id;
    return this.dashboardService.deleteDashboard(id, teamId);
  }

  /** POST /dashboard/:id/duplicate — Duplikasi dashboard */
  @Post(':id/duplicate')
  @UseGuards(AuthGuard('jwt'))
  duplicate(@Param('id') id: string, @Req() req: any) {
    const teamId = req.user?.teamId ?? req.user?.id;
    return this.dashboardService.duplicateDashboard(id, teamId);
  }

  // =============================================
  // SHARE TOKENS
  // =============================================

  /** POST /dashboard/:id/share — Generate share token */
  @Post(':id/share')
  @UseGuards(AuthGuard('jwt'))
  generateToken(
    @Param('id') id: string,
    @Body() dto: GenerateShareTokenDto,
    @Req() req: any,
  ) {
    const teamId = req.user?.teamId ?? req.user?.id;
    return this.dashboardService.generateShareToken(
      id,
      teamId,
      dto.expiryDays ?? 30,
    );
  }

  /** DELETE /dashboard/share/:token — Revoke share token */
  @Delete('share/:token')
  @UseGuards(AuthGuard('jwt'))
  revokeToken(@Param('token') token: string, @Req() req: any) {
    const teamId = req.user?.teamId ?? req.user?.id;
    return this.dashboardService.revokeShareToken(token, teamId);
  }

  // =============================================
  // PUBLIC — Tidak perlu Auth (via share token)
  // =============================================

  /** GET /dashboard/public/:token — Akses dashboard via share token */
  @Get('public/:token')
  getPublic(@Param('token') token: string) {
    return this.dashboardService.getDashboardByToken(token);
  }
}