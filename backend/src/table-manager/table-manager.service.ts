import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parse as csvParse } from 'csv-parse/sync';
import { stringify as csvStringify } from 'csv-stringify/sync';

@Injectable()
export class TableManagerService {
  private readonly logger = new Logger(TableManagerService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── TABLE CRUD ────────────────────────────────────────────────────────────

  async createTable(data: {
    name: string;
    columns: { name: string; type: string; required?: boolean }[];
  }) {
    const existing = await this.prisma.managedTable.findUnique({
      where: { name: data.name },
    });
    if (existing) {
      throw new HttpException(
        `Tabel "${data.name}" sudah ada`,
        HttpStatus.CONFLICT,
      );
    }
    return this.prisma.managedTable.create({
      data: {
        name: data.name,
        columns: data.columns,
      },
    });
  }

  async getAllTables() {
    const tables = await this.prisma.managedTable.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { rows: true } } },
    });
    return tables.map((t) => ({ ...t, rowCount: t._count.rows }));
  }

  async getTableById(id: string) {
    const table = await this.prisma.managedTable.findUnique({
      where: { id },
      include: { _count: { select: { rows: true } } },
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

  // ── ROW CRUD ──────────────────────────────────────────────────────────────

  async getRows(
    tableId: string,
    page = 1,
    limit = 50,
  ): Promise<{ data: any[]; total: number; page: number; totalPages: number }> {
    const table = await this.prisma.managedTable.findUnique({ where: { id: tableId } });
    if (!table) throw new HttpException('Tabel tidak ditemukan', HttpStatus.NOT_FOUND);

    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.prisma.tableRow.findMany({
        where: { managedTableId: tableId },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
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

  async createRow(tableId: string, data: Record<string, any>) {
    const table = await this.prisma.managedTable.findUnique({ where: { id: tableId } });
    if (!table) throw new HttpException('Tabel tidak ditemukan', HttpStatus.NOT_FOUND);

    return this.prisma.tableRow.create({
      data: { managedTableId: tableId, data },
    });
  }

  async updateRow(rowId: string, data: Record<string, any>) {
    const row = await this.prisma.tableRow.findUnique({ where: { id: rowId } });
    if (!row) throw new HttpException('Baris tidak ditemukan', HttpStatus.NOT_FOUND);

    return this.prisma.tableRow.update({
      where: { id: rowId },
      data: { data },
    });
  }

  async deleteRow(rowId: string) {
    const row = await this.prisma.tableRow.findUnique({ where: { id: rowId } });
    if (!row) throw new HttpException('Baris tidak ditemukan', HttpStatus.NOT_FOUND);

    await this.prisma.tableRow.delete({ where: { id: rowId } });
    return { message: 'Baris berhasil dihapus' };
  }

  // ── BATCH OPERATIONS ─────────────────────────────────────────────────────

  async batchDeleteRows(rowIds: string[]): Promise<{ deleted: number }> {
    if (!rowIds || rowIds.length === 0) {
      throw new HttpException('IDs tidak boleh kosong', HttpStatus.BAD_REQUEST);
    }
    const result = await this.prisma.tableRow.deleteMany({
      where: { id: { in: rowIds } },
    });
    return { deleted: result.count };
  }

  async batchCreateRows(
    tableId: string,
    rows: Record<string, any>[],
  ): Promise<{ inserted: number }> {
    const table = await this.prisma.managedTable.findUnique({ where: { id: tableId } });
    if (!table) throw new HttpException('Tabel tidak ditemukan', HttpStatus.NOT_FOUND);

    await this.prisma.tableRow.createMany({
      data: rows.map((row) => ({ managedTableId: tableId, data: row })),
    });
    return { inserted: rows.length };
  }

  // ── IMPORT CSV ────────────────────────────────────────────────────────────

  async importCsv(
    tableId: string,
    csvBuffer: Buffer,
  ): Promise<{ inserted: number; columns: string[] }> {
    const table = await this.prisma.managedTable.findUnique({ where: { id: tableId } });
    if (!table) throw new HttpException('Tabel tidak ditemukan', HttpStatus.NOT_FOUND);

    let records: Record<string, string>[];
    try {
      records = csvParse(csvBuffer.toString('utf-8'), {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (err: any) {
      throw new HttpException(`Format CSV tidak valid: ${err.message}`, HttpStatus.BAD_REQUEST);
    }

    if (records.length === 0) return { inserted: 0, columns: [] };

    const detectedColumns = Object.keys(records[0]);

    // Auto-update column schema jika tabel belum punya kolom
    if (!table.columns || (table.columns as any[]).length === 0) {
      await this.prisma.managedTable.update({
        where: { id: tableId },
        data: {
          columns: detectedColumns.map((c) => ({ name: c, type: 'string' })),
        },
      });
    }

    await this.prisma.tableRow.createMany({
      data: records.map((row) => ({ managedTableId: tableId, data: row })),
    });

    this.logger.log(`✅ Imported ${records.length} rows from CSV to table ${table.name}`);
    return { inserted: records.length, columns: detectedColumns };
  }

  // ── EXPORT CSV ────────────────────────────────────────────────────────────

  async exportCsv(tableId: string): Promise<string> {
    const table = await this.prisma.managedTable.findUnique({
      where: { id: tableId },
      include: { rows: { orderBy: { createdAt: 'asc' } } },
    });
    if (!table) throw new HttpException('Tabel tidak ditemukan', HttpStatus.NOT_FOUND);

    if (table.rows.length === 0) return '';

    // Derive columns dari baris pertama
    const firstRow = table.rows[0].data as Record<string, any>;
    const columns = Object.keys(firstRow);

    const records = table.rows.map((r) => r.data as Record<string, any>);

    return csvStringify(records, {
      header: true,
      columns,
    });
  }
}
