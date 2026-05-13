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
      // 1. Cek dulu apakah datanya ada
      const existingSource = await this.prisma.dataSource.findUnique({
        where: { id: id },
      });

      if (!existingSource) {
        throw new HttpException('Data Source tidak ditemukan', HttpStatus.NOT_FOUND);
      }

      // 2. (Opsional) Kalau mau advance, tambahkan logika panggil API Airbyte 
      // untuk menghapus koneksi di Airbyte Cloud juga menggunakan this.httpService.
      // Tapi untuk demo M2, hapus dari database lokal sudah cukup.

      // 3. Eksekusi hapus dari PostgreSQL
      await this.prisma.dataSource.delete({
        where: { id: id },
      });

      console.log(`✅ Data Source dengan ID ${id} berhasil dihapus.`);
      return { message: 'Data Source berhasil dihapus permanen' };

    } catch (error: any) {
      console.error('Gagal menghapus data source:', error);
      // Lempar error HTTP agar ditangkap oleh Frontend
      throw new HttpException(
        error.response || 'Gagal menghapus data', 
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}