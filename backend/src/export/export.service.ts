import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { stringify } from 'csv-stringify/sync';

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Export DataSources milik platform sebagai CSV.
   * Endpoint ini sekarang protected via JWT — user harus login.
   */
  async getCsvData() {
    const data = await this.prisma.dataSource.findMany({
      take: 1000,
      orderBy: { createdAt: 'desc' },
    });

    const csvString = stringify(data, { header: true });
    return csvString;
  }

  /**
   * Export hasil eksekusi query tertentu sebagai CSV.
   * Ambil dari snapshot hasil query execution terbaru.
   */
  async getQueryResultCsv(queryId: string) {
    const latestExecution = await this.prisma.queryExecution.findFirst({
      where: { queryId, status: 'SUCCESS' },
      orderBy: { executedAt: 'desc' },
    });

    if (!latestExecution?.resultSnapshot) {
      throw new Error(
        'Tidak ada hasil eksekusi yang berhasil untuk query ini.',
      );
    }

    const snapshot = latestExecution.resultSnapshot as any;

    // resultSnapshot bisa berupa array of objects atau { columns: [], rows: [] }
    let dataForCsv: Record<string, any>[];

    if (Array.isArray(snapshot)) {
      dataForCsv = snapshot;
    } else if (snapshot.rows && snapshot.columns) {
      dataForCsv = snapshot.rows.map((row: any[]) => {
        const obj: Record<string, any> = {};
        snapshot.columns.forEach((col: string, i: number) => {
          obj[col] = row[i];
        });
        return obj;
      });
    } else {
      dataForCsv = [snapshot];
    }

    return stringify(dataForCsv, { header: true });
  }
}