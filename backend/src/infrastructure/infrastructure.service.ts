import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InfrastructureService {
  constructor(private prisma: PrismaService) {}

  // Ngambil semua data server/node
  async findAll() {
    return this.prisma.infrastructureNode.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  // Deploy server/node baru
  async create(data: { name: string; type: string }) {
    return this.prisma.infrastructureNode.create({
      data: {
        name: data.name,
        type: data.type,
        status: 'Online', // Default pas baru deploy
        uptime: '0d 0h',
      },
    });
  }

  // Hapus/Matikan server
  async remove(id: string) {
    return this.prisma.infrastructureNode.delete({
      where: { id },
    });
  }
}