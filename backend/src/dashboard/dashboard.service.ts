import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDataSourceDistribution() {
    const allSources = await this.prisma.dataSource.findMany();
    const distribution = allSources.reduce((acc, source) => {
      const type = source.sourceType || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(distribution).map(key => ({
      name: key,
      value: distribution[key]
    }));
  }

  // 1. REAL TRAFFIC DATA
  async getTrafficData() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const executions = await this.prisma.queryExecution.findMany({
      where: {
        executedAt: { gte: sevenDaysAgo } 
      },
      select: { executedAt: true }
    });

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const trafficMap = new Map<string, number>();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      trafficMap.set(days[d.getDay()], 0);
    }

    executions.forEach(log => {
      const dayName = days[log.executedAt.getDay()];
      if (trafficMap.has(dayName)) {
        trafficMap.set(dayName, trafficMap.get(dayName)! + 1);
      }
    });

    return Array.from(trafficMap, ([day, value]) => ({ day, value }));
  }

  // 2. REAL PERFORMANCE DATA
  async getPerformanceData() {
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const executions = await this.prisma.queryExecution.findMany({
      where: {
        status: 'SUCCESS',
        executedAt: { gte: oneDayAgo }
      },
      select: { executedAt: true, durationMs: true }
    });

    const perfMap = new Map<string, { totalTime: number, count: number }>();

    executions.forEach(log => {
      const hourStr = `${log.executedAt.getHours().toString().padStart(2, '0')}:00`;
      
      if (!perfMap.has(hourStr)) {
        perfMap.set(hourStr, { totalTime: 0, count: 0 });
      }
      
      const current = perfMap.get(hourStr)!;
      // Kasih fallback "|| 0" untuk mengatasi durationMs yang null
      current.totalTime += (log.durationMs || 0);
      current.count += 1;
    });

    const result = Array.from(perfMap, ([time, data]) => ({
      time,
      avgTime: data.count > 0 ? Math.round(data.totalTime / data.count) : 0 
    })).sort((a, b) => a.time.localeCompare(b.time));

    if (result.length === 0) {
      return [{ time: 'Belum ada data', avgTime: 0 }];
    }

    return result;
  }

  async saveDashboardLayout(widgets: any, layout: any) {
    return this.prisma.dashboard.upsert({
      where: { id: 'default-dashboard' },
      update: { widgets, layout },
      create: { id: 'default-dashboard', name: 'Main Dashboard', widgets, layout }
    });
  }

  async getDashboardLayout() {
    return this.prisma.dashboard.findUnique({
      where: { id: 'default-dashboard' }
    });
  }
}