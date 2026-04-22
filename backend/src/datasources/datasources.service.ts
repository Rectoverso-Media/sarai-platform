import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DatasourcesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.dataSource.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async create(data: { name: string; type: string; host?: string; connectorId?: string }) {
    return this.prisma.dataSource.create({
      data: {
        name: data.name,
        type: data.type,
        host: data.host,
        connectorId: data.connectorId,
        status: 'Connected',
      },
    });
  }
  // fungsi untuk menghapus data berdasarkan ID
  async remove(id: string) {
    return this.prisma.dataSource.delete({
      where: { id },
    });
  }
}