import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { parse as csvParse } from 'csv-parse/sync';

@Injectable()
export class WarehouseService {
  private readonly logger = new Logger(WarehouseService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── TABLES CRUD ───────────────────────────────────────────────────────────

  async createTable(data: {
    tableName: string;
    schema: { name: string; type: string }[];
    retentionDays?: number;
  }) {
    const existing = await this.prisma.warehouseTable.findUnique({
      where: { tableName: data.tableName },
    });
    if (existing) {
      throw new HttpException(
        `Tabel "${data.tableName}" sudah ada`,
        HttpStatus.CONFLICT,
      );
    }
    return this.prisma.warehouseTable.create({
      data: {
        tableName: data.tableName,
        schema: data.schema,
        retentionDays: data.retentionDays ?? null,
      },
    });
  }

  async getAllTables() {
    const tables = await this.prisma.warehouseTable.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { data: true } },
      },
    });
    return tables.map((t) => ({
      ...t,
      rowCount: t._count.data,
    }));
  }

  async getTableById(id: string) {
    const table = await this.prisma.warehouseTable.findUnique({
      where: { id },
      include: {
        _count: { select: { data: true } },
      },
    });
    if (!table) {
      throw new HttpException('Tabel tidak ditemukan', HttpStatus.NOT_FOUND);
    }
    return { ...table, rowCount: table._count.data };
  }

  async deleteTable(id: string) {
    const table = await this.prisma.warehouseTable.findUnique({ where: { id } });
    if (!table) {
      throw new HttpException('Tabel tidak ditemukan', HttpStatus.NOT_FOUND);
    }
    await this.prisma.warehouseTable.delete({ where: { id } });
    return { message: `Tabel "${table.tableName}" berhasil dihapus` };
  }

  // ── DATA QUERY ────────────────────────────────────────────────────────────

  async getTableData(
    tableId: string,
    page = 1,
    limit = 50,
  ): Promise<{ data: any[]; total: number; page: number; totalPages: number }> {
    const table = await this.prisma.warehouseTable.findUnique({
      where: { id: tableId },
    });
    if (!table) {
      throw new HttpException('Tabel tidak ditemukan', HttpStatus.NOT_FOUND);
    }

    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.prisma.warehouseData.findMany({
        where: { tableId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.warehouseData.count({ where: { tableId } }),
    ]);

    return {
      data: rows.map((r) => ({ id: r.id, ...((r.rowData as object) || {}) })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── IMPORT ────────────────────────────────────────────────────────────────

  async importFromQuery(tableId: string, queryId: string): Promise<{ inserted: number }> {
    const table = await this.prisma.warehouseTable.findUnique({ where: { id: tableId } });
    if (!table) throw new HttpException('Tabel tidak ditemukan', HttpStatus.NOT_FOUND);

    // Ambil execution terakhir yang sukses
    const lastExec = await this.prisma.queryExecution.findFirst({
      where: { queryId, status: 'SUCCESS' },
      orderBy: { executedAt: 'desc' },
      include: { query: true },
    });

    if (!lastExec) {
      throw new HttpException(
        'Belum ada hasil query yang sukses untuk diimport',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Untuk MVP: import sample data dari synced_data jika queryId cocok dengan streamName
    const query = lastExec.query;
    let rows: any[] = [];
    if (query.streamName) {
      const synced = await this.prisma.$queryRaw<any[]>`
        SELECT "recordData" FROM synced_data
        WHERE "streamName" = ${query.streamName}
        LIMIT 1000
      `;
      rows = synced.map((r: any) => r.recordData);
    }

    if (rows.length === 0) {
      return { inserted: 0 };
    }

    await this.prisma.warehouseData.createMany({
      data: rows.map((row) => ({ tableId, rowData: row })),
    });

    this.logger.log(`✅ Imported ${rows.length} rows from query ${queryId} to warehouse table ${tableId}`);
    return { inserted: rows.length };
  }

  async importFromBlend(tableId: string, blendId: string): Promise<{ inserted: number }> {
    const table = await this.prisma.warehouseTable.findUnique({ where: { id: tableId } });
    if (!table) throw new HttpException('Tabel tidak ditemukan', HttpStatus.NOT_FOUND);

    const blend = await this.prisma.blend.findUnique({
      where: { id: blendId },
      include: { sources: { include: { dataSource: true } } },
    });
    if (!blend) throw new HttpException('Blend tidak ditemukan', HttpStatus.NOT_FOUND);

    // Ambil data dari source pertama untuk demo MVP
    const firstSource = blend.sources[0];
    if (!firstSource) return { inserted: 0 };

    // Ambil rows dari synced_data untuk source pertama
    const connections = await this.prisma.connection.findMany({
      where: { dataSourceId: firstSource.dataSourceId },
    });
    if (connections.length === 0) return { inserted: 0 };

    const rows: any[] = [];
    for (const conn of connections) {
      const synced = await this.prisma.syncedData.findMany({
        where: { connectionId: conn.id },
        take: 500,
      });
      rows.push(...synced.map((s) => s.recordData));
    }

    if (rows.length === 0) return { inserted: 0 };

    await this.prisma.warehouseData.createMany({
      data: rows.map((row) => ({ tableId, rowData: row })),
    });

    return { inserted: rows.length };
  }

  async importFromCsv(tableId: string, csvBuffer: Buffer): Promise<{ inserted: number }> {
    const table = await this.prisma.warehouseTable.findUnique({ where: { id: tableId } });
    if (!table) throw new HttpException('Tabel tidak ditemukan', HttpStatus.NOT_FOUND);

    let records: any[];
    try {
      records = csvParse(csvBuffer.toString('utf-8'), {
        columns: true,          // First row = header
        skip_empty_lines: true,
        trim: true,
      });
    } catch (err: any) {
      throw new HttpException(`Format CSV tidak valid: ${err.message}`, HttpStatus.BAD_REQUEST);
    }

    if (records.length === 0) return { inserted: 0 };

    await this.prisma.warehouseData.createMany({
      data: records.map((row) => ({ tableId, rowData: row })),
    });

    return { inserted: records.length };
  }

  // ── RETENTION POLICY ─────────────────────────────────────────────────────

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async applyRetentionPolicy() {
    this.logger.log('🗑️ Menjalankan retention policy cleanup...');

    const tables = await this.prisma.warehouseTable.findMany({
      where: { retentionDays: { not: null } },
    });

    let totalDeleted = 0;
    for (const table of tables) {
      if (!table.retentionDays) continue;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - table.retentionDays);

      const result = await this.prisma.warehouseData.deleteMany({
        where: {
          tableId: table.id,
          createdAt: { lt: cutoffDate },
        },
      });

      if (result.count > 0) {
        this.logger.log(
          `  → "${table.tableName}": deleted ${result.count} rows older than ${table.retentionDays} days`,
        );
        totalDeleted += result.count;
      }
    }

    this.logger.log(`✅ Retention cleanup selesai. Total dihapus: ${totalDeleted} rows.`);
  }
}
