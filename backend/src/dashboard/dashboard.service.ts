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

  getTrafficData() {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result: { day: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i); 
      result.push({ day: days[d.getDay()], value: Math.floor(Math.random() * 70) + 20 });
    }
    return result;
  }

  getPerformanceData() {
    const times = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
    const result: { time: string; avgTime: number }[] = [];
    times.forEach(time => {
      result.push({ time: time, avgTime: Math.floor(Math.random() * 250) + 50 });
    });
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