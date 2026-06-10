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
    retentionDays?: number;
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
        retentionDays: data.retentionDays ?? null,
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

  async updateTable(
    id: string,
    data: {
      name?: string;
      columns?: { name: string; type: string; required?: boolean }[];
      retentionDays?: number | null;
    },
  ) {
    const table = await this.prisma.managedTable.findUnique({ where: { id } });
    if (!table) {
      throw new HttpException('Tabel tidak ditemukan', HttpStatus.NOT_FOUND);
    }
    // Cek nama unik jika diubah
    if (data.name && data.name !== table.name) {
      const conflict = await this.prisma.managedTable.findUnique({
        where: { name: data.name },
      });
      if (conflict) {
        throw new HttpException(`Nama tabel "${data.name}" sudah dipakai`, HttpStatus.CONFLICT);
      }
    }
    return this.prisma.managedTable.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.columns !== undefined && { columns: data.columns }),
        ...(data.retentionDays !== undefined && { retentionDays: data.retentionDays }),
      },
    });
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

    // Validasi field wajib terhadap schema kolom
    const columns = (table.columns as { name: string; type: string; required?: boolean }[]) || [];
    const requiredCols = columns.filter((c) => c.required).map((c) => c.name);
    const missingFields = requiredCols.filter((col) => data[col] === undefined || data[col] === null || data[col] === '');
    if (missingFields.length > 0) {
      throw new HttpException(
        `Field wajib tidak boleh kosong: ${missingFields.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

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

    if (!rows || rows.length === 0) {
      throw new HttpException('Data rows tidak boleh kosong', HttpStatus.BAD_REQUEST);
    }

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

  async exportCsv(tableId: string): Promise<{ csv: string; filename: string; rowCount: number }> {
    const table = await this.prisma.managedTable.findUnique({
      where: { id: tableId },
      include: { rows: { orderBy: { createdAt: 'asc' } } },
    });
    if (!table) throw new HttpException('Tabel tidak ditemukan', HttpStatus.NOT_FOUND);

    // Tentukan kolom dari schema atau dari baris pertama
    let columns: string[] = [];
    if (table.columns && (table.columns as any[]).length > 0) {
      columns = (table.columns as { name: string }[]).map((c) => c.name);
    } else if (table.rows.length > 0) {
      columns = Object.keys(table.rows[0].data as Record<string, any>);
    }

    if (table.rows.length === 0) {
      // Return header-only CSV jika tidak ada data
      const headerCsv = columns.length > 0 ? columns.join(',') + '\n' : '';
      return { csv: headerCsv, filename: `table-${table.name}.csv`, rowCount: 0 };
    }

    const records = table.rows.map((r) => r.data as Record<string, any>);
    const csv = csvStringify(records, { header: true, columns });

    return { csv, filename: `table-${table.name}.csv`, rowCount: table.rows.length };
  }
}
