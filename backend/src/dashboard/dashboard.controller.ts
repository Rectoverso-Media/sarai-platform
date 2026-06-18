import {
  Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { GenerateShareTokenDto } from './dto/generate-share-token.dto';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // =============================================
  // STATS (tidak butuh auth agar bisa diakses dari shared page)
  // =============================================

  @Get('stats/summary')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Ambil ringkasan statistik (total sources, queries, users)' })
  @ApiResponse({ status: 200, description: 'Summary stats berhasil diambil' })
  getSummary() {
    return this.dashboardService.getSummaryStats();
  }

  @Get('stats/distribution')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Ambil distribusi data source berdasarkan tipe' })
  @ApiResponse({ status: 200, description: 'Distribution data berhasil diambil' })
  getDistribution() {
    return this.dashboardService.getDataSourceDistribution();
  }

  @Get('stats/traffic')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Ambil data traffic query 7 hari terakhir' })
  @ApiResponse({ status: 200, description: 'Traffic data berhasil diambil' })
  getTraffic() {
    return this.dashboardService.getTrafficData();
  }

  @Get('stats/performance')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Ambil data performa query per jam' })
  @ApiResponse({ status: 200, description: 'Performance data berhasil diambil' })
  getPerformance() {
    return this.dashboardService.getPerformanceData();
  }

  // =============================================
  // DASHBOARD CRUD — Semua butuh Auth
  // =============================================

  /** POST /dashboard — Buat dashboard baru */
  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buat dashboard baru' })
  @ApiResponse({ status: 201, description: 'Dashboard berhasil dibuat' })
  create(@Body() dto: CreateDashboardDto, @Req() req: any) {
    const teamId = req.user?.teamId ?? req.user?.id;
    return this.dashboardService.createDashboard(teamId, dto);
  }

  /** GET /dashboard — List semua dashboard team */
  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List semua dashboard milik team' })
  @ApiResponse({ status: 200, description: 'Daftar dashboard berhasil diambil' })
  list(@Req() req: any) {
    const teamId = req.user?.teamId ?? req.user?.id;
    return this.dashboardService.listDashboards(teamId);
  }

  /** GET /dashboard/:id — Ambil satu dashboard */
  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Ambil detail dashboard beserta widget dan layout' })
  @ApiResponse({ status: 200, description: 'Detail dashboard berhasil diambil' })
  @ApiResponse({ status: 404, description: 'Dashboard tidak ditemukan' })
  getOne(@Param('id') id: string, @Req() req: any) {
    const teamId = req.user?.teamId ?? req.user?.id;
    return this.dashboardService.getDashboard(id, teamId);
  }

  /** PUT /dashboard/:id — Update dashboard */
  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update dashboard (widget, layout, settings)' })
  @ApiResponse({ status: 200, description: 'Dashboard berhasil diupdate' })
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
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hapus dashboard beserta semua widget' })
  @ApiResponse({ status: 200, description: 'Dashboard berhasil dihapus' })
  remove(@Param('id') id: string, @Req() req: any) {
    const teamId = req.user?.teamId ?? req.user?.id;
    return this.dashboardService.deleteDashboard(id, teamId);
  }

  /** POST /dashboard/:id/duplicate — Duplikasi dashboard */
  @Post(':id/duplicate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Duplikasi dashboard beserta widget dan layout' })
  @ApiResponse({ status: 201, description: 'Dashboard berhasil diduplikasi' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Generate share token untuk public access dashboard' })
  @ApiResponse({ status: 201, description: 'Share token berhasil dibuat' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Revoke (hapus) share token dashboard' })
  @ApiResponse({ status: 200, description: 'Share token berhasil di-revoke' })
  revokeToken(@Param('token') token: string, @Req() req: any) {
    const teamId = req.user?.teamId ?? req.user?.id;
    return this.dashboardService.revokeShareToken(token, teamId);
  }

  // =============================================
  // PUBLIC — Tidak perlu Auth (via share token)
  // =============================================

  /** GET /dashboard/public/:token — Akses dashboard via share token */
  @Get('public/:token')
  @ApiOperation({ summary: 'Akses dashboard publik via share token (tanpa auth)' })
  @ApiResponse({ status: 200, description: 'Dashboard berhasil diambil' })
  @ApiResponse({ status: 404, description: 'Share token tidak valid atau expired' })
  getPublic(@Param('token') token: string) {
    return this.dashboardService.getDashboardByToken(token);
  }
}