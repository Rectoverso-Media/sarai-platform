import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SecurityService {
  constructor(private prisma: PrismaService) {}

  // Ambil semua log, urutkan dari yang paling baru
  async findAll() {
    return this.prisma.securityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50, // Batasi 50 log terbaru biar nggak berat
    });
  }

  // Catat aktivitas baru
  async logAction(data: { action: string; actor: string; details?: string; ipAddress?: string }) {
    return this.prisma.securityLog.create({
      data: {
        action: data.action,
        actor: data.actor,
        details: data.details,
        ipAddress: data.ipAddress || '192.168.1.1',
      },
    });
  }
}