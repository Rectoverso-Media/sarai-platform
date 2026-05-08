import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DatasourcesService {
  private prisma = new PrismaClient();
  constructor(private readonly prismaService: PrismaService) {}
  // FUNGSI SIMPAN DATA SOURCE BARU
  async createDataSource(data: any) {
    try {
      // LOGIKA TRIAL 14 HARI (Otomatis ngitung 14 hari ke depan)
      const dateNow = new Date();
      const dateExpired = new Date();
      dateExpired.setDate(dateNow.getDate() + 14);

      // Simpan ke Database Prisma
      const newSource = await this.prisma.dataSource.create({
        data: {
          name: data.name,
          sourceType: data.type, // FIX: Ubah dari 'type' menjadi 'sourceType'
          connectorName: data.connectorId || null,
          airbyteHost: data.host || null,
          airbyteSourceId: data.airbyteSourceId || `mock-id-${Date.now()}`, // Sementara pakai mock ID kalau bukan dari Airbyte
          
          // Masukkan data Trial-nya
          trialStartsAt: dateNow,
          trialEndsAt: dateExpired,
          isTrialActive: true,
          status: 'Connected'
        },
      });

      return { 
        message: 'Data Source berhasil ditambahkan dengan Trial 14 Hari! 🎉', 
        data: newSource 
      };
    } catch (error) {
      console.error('Error createDataSource:', error);
      throw new HttpException('Gagal menyimpan Data Source', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // FUNGSI AMBIL DAFTAR DATA SOURCE (Biar tabel Frontend nampilin dari Database asli)
  async getAllDataSources() {
    try {
      const sources = await this.prisma.dataSource.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return { message: 'Berhasil mengambil daftar koneksi', data: sources };
    } catch (error) {
      throw new HttpException('Gagal mengambil data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // FUNGSI HAPUS DATA SOURCE
  async deleteDataSource(id: string) {
    try {
      await this.prisma.dataSource.delete({
        where: { id: id }
      });
      return { message: 'Berhasil menghapus Data Source!' };
    } catch (error) {
      throw new HttpException('Gagal menghapus data', HttpStatus.BAD_REQUEST);
    }
  }
}