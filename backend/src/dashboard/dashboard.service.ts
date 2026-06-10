import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  // =============================================
  // DASHBOARD CRUD
  // =============================================

  /** Buat dashboard baru untuk sebuah team */
  async createDashboard(teamId: string, dto: CreateDashboardDto) {
    return this.prisma.dashboard.create({
      data: {
        teamId,
        name: dto.name,
        description: dto.description,
        isPublic: dto.isPublic ?? false,
        autoRefreshSeconds: dto.autoRefreshSeconds ?? null,
        theme: dto.theme ?? 'light',
        widgets: [],
        layout: [],
      },
    });
  }

  /** List semua dashboard milik team */
  async listDashboards(teamId: string) {
    return this.prisma.dashboard.findMany({
      where: { teamId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        isPublic: true,
        theme: true,
        autoRefreshSeconds: true,
        createdAt: true,
        updatedAt: true,
        shareTokens: {
          select: { token: true, expiresAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  /** Ambil satu dashboard by ID, validasi ownership */
  async getDashboard(id: string, teamId: string) {
    const dashboard = await this.prisma.dashboard.findUnique({
      where: { id },
      include: { shareTokens: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!dashboard) throw new NotFoundException('Dashboard tidak ditemukan');
    if (dashboard.teamId && dashboard.teamId !== teamId)
      throw new ForbiddenException('Akses ditolak');
    return dashboard;
  }

  /** Update metadata atau layout dashboard */
  async updateDashboard(id: string, teamId: string, dto: UpdateDashboardDto) {
    await this.getDashboard(id, teamId); // validasi ownership
    return this.prisma.dashboard.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
        ...(dto.autoRefreshSeconds !== undefined && {
          autoRefreshSeconds: dto.autoRefreshSeconds,
        }),
        ...(dto.theme !== undefined && { theme: dto.theme }),
        ...(dto.widgets !== undefined && { widgets: dto.widgets }),
        ...(dto.layout !== undefined && { layout: dto.layout }),
      },
    });
  }

  /** Hapus dashboard */
  async deleteDashboard(id: string, teamId: string) {
    await this.getDashboard(id, teamId); // validasi ownership
    await this.prisma.dashboard.delete({ where: { id } });
    return { success: true, message: 'Dashboard berhasil dihapus' };
  }

  /** Duplikasi dashboard beserta widget-nya */
  async duplicateDashboard(id: string, teamId: string) {
    const original = await this.getDashboard(id, teamId);
    return this.prisma.dashboard.create({
      data: {
        teamId,
        name: `${original.name} (Copy)`,
        description: original.description,
        isPublic: false,
        autoRefreshSeconds: original.autoRefreshSeconds,
        theme: original.theme,
        // Round-trip via JSON to satisfy Prisma's InputJsonValue type constraint
        widgets: original.widgets ? JSON.parse(JSON.stringify(original.widgets)) : [],
        layout: original.layout ? JSON.parse(JSON.stringify(original.layout)) : [],
      },
    });
  }

  // =============================================
  // PUBLIC SHARING — TOKEN-BASED
  // =============================================

  /** Generate share token dengan expiry */
  async generateShareToken(
    dashboardId: string,
    teamId: string,
    expiryDays = 30,
  ) {
    await this.getDashboard(dashboardId, teamId); // validasi ownership

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const shareToken = await this.prisma.shareToken.create({
      data: { dashboardId, expiresAt },
    });

    return {
      token: shareToken.token,
      expiresAt: shareToken.expiresAt,
      shareUrl: `/shared/${shareToken.token}`,
    };
  }

  /** Ambil dashboard via token publik (tanpa auth) */
  async getDashboardByToken(token: string) {
    const shareToken = await this.prisma.shareToken.findUnique({
      where: { token },
      include: { dashboard: true },
    });

    if (!shareToken) throw new NotFoundException('Token tidak valid');
    if (new Date() > shareToken.expiresAt)
      throw new ForbiddenException('Token sudah expired');

    return shareToken.dashboard;
  }

  /** Revoke / hapus share token */
  async revokeShareToken(token: string, teamId: string) {
    const shareToken = await this.prisma.shareToken.findUnique({
      where: { token },
      include: { dashboard: true },
    });
    if (!shareToken) throw new NotFoundException('Token tidak ditemukan');
    if (shareToken.dashboard.teamId !== teamId)
      throw new ForbiddenException('Akses ditolak');

    await this.prisma.shareToken.delete({ where: { token } });
    return { success: true };
  }

  // =============================================
  // STATS (untuk dashboard analytics utama)
  // =============================================

  async getSummaryStats() {
    const [totalUsers, totalSources, connectedSources, totalQueries, executionsToday] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.dataSource.count(),
        this.prisma.dataSource.count({ where: { status: 'Connected' } }),
        this.prisma.query.count(),
        this.prisma.queryExecution.count({
          where: {
            executedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        }),
      ]);

    return {
      totalUsers,
      totalSources,
      connectedSources,
      totalQueries,
      executionsToday,
    };
  }

  async getDataSourceDistribution() {
    const allSources = await this.prisma.dataSource.findMany();
    const distribution = allSources.reduce(
      (acc, source) => {
        const type = source.sourceType || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.keys(distribution).map((key) => ({
      name: key,
      value: distribution[key],
    }));
  }

  async getTrafficData() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const executions = await this.prisma.queryExecution.findMany({
      where: { executedAt: { gte: sevenDaysAgo } },
      select: { executedAt: true },
    });

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const trafficMap = new Map<string, number>();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      trafficMap.set(days[d.getDay()], 0);
    }

    executions.forEach((log) => {
      const dayName = days[log.executedAt.getDay()];
      if (trafficMap.has(dayName)) {
        trafficMap.set(dayName, trafficMap.get(dayName)! + 1);
      }
    });

    return Array.from(trafficMap, ([day, value]) => ({ day, value }));
  }

  async getPerformanceData() {
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const executions = await this.prisma.queryExecution.findMany({
      where: { status: 'SUCCESS', executedAt: { gte: oneDayAgo } },
      select: { executedAt: true, durationMs: true },
    });

    const perfMap = new Map<string, { totalTime: number; count: number }>();

    executions.forEach((log) => {
      const hourStr = `${log.executedAt.getHours().toString().padStart(2, '0')}:00`;
      if (!perfMap.has(hourStr)) {
        perfMap.set(hourStr, { totalTime: 0, count: 0 });
      }
      const current = perfMap.get(hourStr)!;
      current.totalTime += log.durationMs || 0;
      current.count += 1;
    });

    const result = Array.from(perfMap, ([time, data]) => ({
      time,
      avgTime: data.count > 0 ? Math.round(data.totalTime / data.count) : 0,
    })).sort((a, b) => a.time.localeCompare(b.time));

    return result.length === 0 ? [{ time: 'No data', avgTime: 0 }] : result;
  }
}