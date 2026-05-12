import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; 
import { stringify } from 'csv-stringify/sync';

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  async getCsvData(token: string) {
    // Kita gunakan tabel 'dataSource' yang 100% ADA di schema.prisma kamu
    const data = await this.prisma.dataSource.findMany({
      take: 1000, 
      orderBy: { createdAt: 'desc' }
    });

    if (!data || data.length === 0) {
      throw new NotFoundException('Data DataSource tidak ditemukan atau masih kosong.');
    }

    // Convert data JSON dari database menjadi format CSV
    const csvString = stringify(data, {
      header: true, 
    });

    return csvString;
  }
}