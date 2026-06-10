import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { parse as csvParse } from 'csv-parse/sync';

/**
 * WarehouseService — wraps ManagedTable/TableRow (shared model dengan TableManagerService).
 * Route /warehouse/tables → same DB model, adds retentionDays & import-from-query/blend support.
 */
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
    const existing = await this.prisma.managedTable.findUnique({
      where: { name: data.tableName },
    });
    if (existing) {
      throw new HttpException(
        `Tabel "${data.tableName}" sudah ada`,
        HttpStatus.CONFLICT,
      );
    }
    return this.prisma.managedTable.create({
      data: {
        name: data.tableName,
        columns: data.schema,
        retentionDays: data.retentionDays ?? null,
      },
    });
  }

  async getAllTables() {
    const tables = await this.prisma.managedTable.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { rows: true } },
      },
    });
    return tables.map((t) => ({
      ...t,
      rowCount: t._count.rows,
    }));
  }

  async getTableById(id: string) {
    const table = await this.prisma.managedTable.findUnique({
      where: { id },
      include: {
        _count: { select: { rows: true } },
      },
    });
    if (!table) {
      throw new HttpException('Tabel tidak ditemukan', HttpStatus.NOT_FOUND);
    }
    return { ...table, rowCount: table._count.rows };
  }

  async deleteTable(id: string) {
    const table = await this.prisma.managedTable.findUnique({ where: { id } });
    if (!table) {
      throw new HttpException('Tabel tidak ditemukan', HttpStatus.NOT_FOUND);
    }
    await this.prisma.managedTable.delete({ where: { id } });
    return { message: `Tabel "${table.name}" berhasil dihapus` };
  }

  // ── DATA QUERY ────────────────────────────────────────────────────────────

  async getTableData(
    tableId: string,
    page = 1,
    limit = 50,
  ): Promise<{ data: any[]; total: number; page: number; totalPages: number }> {
    const table = await this.prisma.managedTable.findUnique({
      where: { id: tableId },
    });
    if (!table) {
      throw new HttpException('Tabel tidak ditemukan', HttpStatus.NOT_FOUND);
    }

    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.prisma.tableRow.findMany({
        where: { managedTableId: tableId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tableRow.count({ where: { managedTableId: tableId } }),
    ]);

    return {
      data: rows.map((r) => ({ id: r.id, ...((r.data as object) || {}) })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── IMPORT ────────────────────────────────────────────────────────────────

  async importFromQuery(tableId: string, queryId: string): Promise<{ inserted: number }> {
    const table = await this.prisma.managedTable.findUnique({ where: { id: tableId } });
    if (!table) throw new HttpException('Tabel tidak ditemukan', HttpStatus.NOT_FOUND);

    // Baca resultSnapshot dari QueryExecution terakhir yang sukses
    const lastExec = await this.prisma.queryExecution.findFirst({
      where: { queryId, status: 'SUCCESS' },
      orderBy: { executedAt: 'desc' },
    });

    if (!lastExec || !lastExec.resultSnapshot) {
      throw new HttpException(
        'Belum ada snapshot hasil query. Jalankan query terlebih dahulu agar snapshot tersimpan.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const snapshot = lastExec.resultSnapshot as { columns: string[]; rows: any[][] };
    const { columns, rows } = snapshot;

    if (!rows || rows.length === 0) {
      return { inserted: 0 };
    }

    // Konversi dari array-of-arrays ke array-of-objects
    const records = rows.map((row) =>
      Object.fromEntries(columns.map((col, i) => [col, row[i]])),
    );

    // Update schema tabel jika masih kosong
    if (!table.columns || (table.columns as any[]).length === 0) {
      await this.prisma.managedTable.update({
        where: { id: tableId },
        data: {
          columns: columns.map((c) => ({ name: c, type: 'string' })),
        },
      });
    }

    await this.prisma.tableRow.createMany({
      data: records.map((row) => ({ managedTableId: tableId, data: row })),
    });

    this.logger.log(`✅ Imported ${records.length} rows from query ${queryId} to table ${tableId}`);
    return { inserted: records.length };
  }

  async importFromBlend(tableId: string, blendId: string): Promise<{ inserted: number }> {
    const table = await this.prisma.managedTable.findUnique({ where: { id: tableId } });
    if (!table) throw new HttpException('Tabel tidak ditemukan', HttpStatus.NOT_FOUND);

    const blend = await this.prisma.blend.findUnique({
      where: { id: blendId },
      include: { sources: { include: { dataSource: { include: { connections: true } } } } },
    });
    if (!blend) throw new HttpException('Blend tidak ditemukan', HttpStatus.NOT_FOUND);

    // Ambil data dari SyncedData untuk semua source
    const allRecords: Record<string, any>[] = [];
    const columnSet = new Set<string>();

    for (const src of blend.sources) {
      for (const conn of src.dataSource.connections) {
        const synced = await this.prisma.syncedData.findMany({
          where: { connectionId: conn.id },
          take: 500,
        });
        for (const s of synced) {
          const rec = s.recordData as Record<string, any>;
          Object.keys(rec).forEach((k) => columnSet.add(k));
          allRecords.push(rec);
        }
      }
    }

    if (allRecords.length === 0) return { inserted: 0 };

    // Update schema tabel jika masih kosong
    if (!table.columns || (table.columns as any[]).length === 0) {
      await this.prisma.managedTable.update({
        where: { id: tableId },
        data: {
          columns: Array.from(columnSet).map((c) => ({ name: c, type: 'string' })),
        },
      });
    }

    await this.prisma.tableRow.createMany({
      data: allRecords.map((row) => ({ managedTableId: tableId, data: row })),
    });

    return { inserted: allRecords.length };
  }

  async importFromCsv(tableId: string, csvBuffer: Buffer): Promise<{ inserted: number }> {
    const table = await this.prisma.managedTable.findUnique({ where: { id: tableId } });
    if (!table) throw new HttpException('Tabel tidak ditemukan', HttpStatus.NOT_FOUND);

    let records: any[];
    try {
      records = csvParse(csvBuffer.toString('utf-8'), {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (err: any) {
      throw new HttpException(`Format CSV tidak valid: ${err.message}`, HttpStatus.BAD_REQUEST);
    }

    if (records.length === 0) return { inserted: 0 };

    // Update schema tabel jika masih kosong
    if (!table.columns || (table.columns as any[]).length === 0) {
      const detectedCols = Object.keys(records[0]);
      await this.prisma.managedTable.update({
        where: { id: tableId },
        data: {
          columns: detectedCols.map((c) => ({ name: c, type: 'string' })),
        },
      });
    }

    await this.prisma.tableRow.createMany({
      data: records.map((row) => ({ managedTableId: tableId, data: row })),
    });

    return { inserted: records.length };
  }

  // ── RETENTION POLICY ─────────────────────────────────────────────────────

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async applyRetentionPolicy() {
    this.logger.log('🗑️ Menjalankan retention policy cleanup...');

    const tables = await this.prisma.managedTable.findMany({
      where: { retentionDays: { not: null } },
    });

    let totalDeleted = 0;
    for (const table of tables) {
      if (!table.retentionDays) continue;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - table.retentionDays);

      const result = await this.prisma.tableRow.deleteMany({
        where: {
          managedTableId: table.id,
          createdAt: { lt: cutoffDate },
        },
      });

      if (result.count > 0) {
        this.logger.log(
          `  → "${table.name}": deleted ${result.count} rows older than ${table.retentionDays} days`,
        );
        totalDeleted += result.count;
      }
    }

    this.logger.log(`✅ Retention cleanup selesai. Total dihapus: ${totalDeleted} rows.`);
  }
}
