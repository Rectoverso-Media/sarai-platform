import { Injectable, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DatasourcesService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────────────────────────

  async createDataSource(data: any) {
    try {
      const dateNow = new Date();
      const dateExpired = new Date();
      dateExpired.setDate(dateNow.getDate() + 14);

      const newSource = await this.prisma.dataSource.create({
        data: {
          name: data.name,
          sourceType: data.type,
          connectorName: data.connectorId || null,
          airbyteHost: data.host || null,
          airbyteSourceId: data.airbyteSourceId || `mock-id-${Date.now()}`,
          trialStartsAt: dateNow,
          trialEndsAt: dateExpired,
          isTrialActive: true,
          status: 'Connected',
        },
      });

      return {
        message: 'Data Source berhasil ditambahkan dengan Trial 14 Hari! 🎉',
        data: newSource,
      };
    } catch (error) {
      console.error('Error createDataSource:', error);
      throw new HttpException('Gagal menyimpan Data Source', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // READ
  // ─────────────────────────────────────────────────────────────────────────

  async getAllDataSources() {
    try {
      const sources = await this.prisma.dataSource.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return { message: 'Berhasil mengambil daftar koneksi', data: sources };
    } catch (error) {
      throw new HttpException('Gagal mengambil data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getDataSourceById(id: string) {
    const source = await this.prisma.dataSource.findUnique({
      where: { id },
    });

    if (!source) {
      throw new NotFoundException(`Data Source dengan ID ${id} tidak ditemukan`);
    }

    // Hitung sisa hari trial
    let trialDaysLeft: number | null = null;
    if (source.isTrialActive && source.trialEndsAt) {
      const now = new Date();
      const diff = source.trialEndsAt.getTime() - now.getTime();
      trialDaysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    return {
      message: 'Berhasil mengambil detail Data Source',
      data: {
        ...source,
        trialDaysLeft,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────────────────────────────────

  async updateDataSource(id: string, data: { name?: string; status?: string }) {
    const existing = await this.prisma.dataSource.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`Data Source dengan ID ${id} tidak ditemukan`);
    }

    const updated = await this.prisma.dataSource.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.status && { status: data.status }),
      },
    });

    return {
      message: 'Data Source berhasil diupdate',
      data: updated,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────────────────────────────────

  async deleteDataSource(id: string) {
    try {
      const existingSource = await this.prisma.dataSource.findUnique({
        where: { id },
      });

      if (!existingSource) {
        throw new HttpException('Data Source tidak ditemukan', HttpStatus.NOT_FOUND);
      }

      await this.prisma.dataSource.delete({ where: { id } });

      console.log(`✅ Data Source dengan ID ${id} berhasil dihapus.`);
      return { message: 'Data Source berhasil dihapus permanen' };
    } catch (error: any) {
      console.error('Gagal menghapus data source:', error);
      throw new HttpException(
        error.response || 'Gagal menghapus data',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}