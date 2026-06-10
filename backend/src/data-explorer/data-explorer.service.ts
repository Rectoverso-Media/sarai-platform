import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExplorerQueryDto, FilterConditionDto } from './dto/explorer-query.dto';
import { stringify } from 'csv-stringify/sync';
import * as XLSX from 'xlsx';

@Injectable()
export class DataExplorerService {
  constructor(private prisma: PrismaService) {}

  /**
   * List available tables / streams per source type
   */
  async listAvailableTables() {
    const [syncedStreams, managedTables] = await Promise.all([
      this.prisma.syncedData.groupBy({
        by: ['streamName'],
        _count: { streamName: true },
        orderBy: { _count: { streamName: 'desc' } },
      }),
      this.prisma.managedTable.findMany({
        select: { name: true, id: true, createdAt: true },
      }),
    ]);

    return {
      synced_data: syncedStreams.map((s) => ({
        name: s.streamName,
        rowCount: s._count.streamName,
        source: 'Airbyte Sync',
      })),
      managed_table: managedTables.map((t) => ({
        name: t.name,
        id: t.id,
        source: 'Table Manager',
      })),
      query_execution: [
        { name: 'query_executions', source: 'Query History' },
      ],
    };
  }

  /**
   * Query data dengan filter, sort, dan pagination
   */
  async queryData(dto: ExplorerQueryDto) {
    const page = dto.page ?? 1;
    const pageSize = Math.min(dto.pageSize ?? 50, 500); // max 500 rows per page
    const skip = (page - 1) * pageSize;

    if (dto.tableSource === 'synced_data') {
      return this.querySyncedData(dto, skip, pageSize);
    } else if (dto.tableSource === 'managed_table') {
      return this.queryManagedTable(dto, skip, pageSize);
    } else if (dto.tableSource === 'query_execution') {
      return this.queryExecutionHistory(dto, skip, pageSize);
    }

    throw new BadRequestException('tableSource tidak valid');
  }

  private async querySyncedData(
    dto: ExplorerQueryDto,
    skip: number,
    take: number,
  ) {
    const whereBase: any = {};
    if (dto.tableName) whereBase.streamName = dto.tableName;

    const [total, rows] = await Promise.all([
      this.prisma.syncedData.count({ where: whereBase }),
      this.prisma.syncedData.findMany({
        where: whereBase,
        orderBy: { syncedAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          streamName: true,
          recordData: true,
          syncedAt: true,
        },
      }),
    ]);

    // Flatten recordData ke top-level untuk display
    const data = rows.map((r) => ({
      _id: r.id,
      _stream: r.streamName,
      _syncedAt: r.syncedAt,
      ...(r.recordData as object),
    }));

    // Apply client-side filters on recordData JSON fields
    const filtered = this.applyFilters(data, dto.filters);
    const sorted = this.applySorts(filtered, dto.sorts);

    return {
      data: sorted,
      total,
      page: skip / take + 1,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    };
  }

  private async queryManagedTable(
    dto: ExplorerQueryDto,
    skip: number,
    take: number,
  ) {
    if (!dto.tableName) throw new BadRequestException('tableName diperlukan untuk managed_table');

    const table = await this.prisma.managedTable.findUnique({
      where: { name: dto.tableName },
    });
    if (!table) throw new BadRequestException(`Table '${dto.tableName}' tidak ditemukan`);

    const [total, rows] = await Promise.all([
      this.prisma.tableRow.count({ where: { managedTableId: table.id } }),
      this.prisma.tableRow.findMany({
        where: { managedTableId: table.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    const data = rows.map((r) => ({
      _id: r.id,
      _createdAt: r.createdAt,
      ...(r.data as object),
    }));

    const filtered = this.applyFilters(data, dto.filters);
    const sorted = this.applySorts(filtered, dto.sorts);

    return {
      data: sorted,
      total,
      page: skip / take + 1,
      pageSize: take,
      totalPages: Math.ceil(total / take),
      columns: table.columns, // Schema kolom dari table definition
    };
  }

  private async queryExecutionHistory(
    dto: ExplorerQueryDto,
    skip: number,
    take: number,
  ) {
    const [total, rows] = await Promise.all([
      this.prisma.queryExecution.count(),
      this.prisma.queryExecution.findMany({
        orderBy: { executedAt: 'desc' },
        skip,
        take,
        include: { query: { select: { name: true } } },
      }),
    ]);

    const data = rows.map((r) => ({
      id: r.id,
      queryName: r.query?.name ?? 'Unknown',
      status: r.status,
      durationMs: r.durationMs,
      rowsReturned: r.rowsReturned,
      errorMessage: r.errorMessage,
      executedAt: r.executedAt,
    }));

    const filtered = this.applyFilters(data, dto.filters);
    const sorted = this.applySorts(filtered, dto.sorts);

    return {
      data: sorted,
      total,
      page: skip / take + 1,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    };
  }

  // =============================================
  // FILTER & SORT HELPERS
  // =============================================

  private applyFilters(data: any[], filters?: FilterConditionDto[]) {
    if (!filters || filters.length === 0) return data;

    return data.filter((row) =>
      filters.every((f) => {
        const val = row[f.column];
        switch (f.operator) {
          case 'eq':       return val == f.value;
          case 'neq':      return val != f.value;
          case 'gt':       return Number(val) > Number(f.value);
          case 'gte':      return Number(val) >= Number(f.value);
          case 'lt':       return Number(val) < Number(f.value);
          case 'lte':      return Number(val) <= Number(f.value);
          case 'contains': return String(val ?? '').toLowerCase().includes(String(f.value ?? '').toLowerCase());
          case 'startsWith': return String(val ?? '').toLowerCase().startsWith(String(f.value ?? '').toLowerCase());
          case 'endsWith': return String(val ?? '').toLowerCase().endsWith(String(f.value ?? '').toLowerCase());
          case 'isNull':   return val === null || val === undefined;
          case 'isNotNull': return val !== null && val !== undefined;
          default:         return true;
        }
      }),
    );
  }

  private applySorts(data: any[], sorts?: { column: string; direction: 'asc' | 'desc' }[]) {
    if (!sorts || sorts.length === 0) return data;

    return [...data].sort((a, b) => {
      for (const sort of sorts) {
        const aVal = a[sort.column];
        const bVal = b[sort.column];
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        if (cmp !== 0) return sort.direction === 'asc' ? cmp : -cmp;
      }
      return 0;
    });
  }

  // =============================================
  // EXPORT
  // =============================================

  async exportCsv(dto: ExplorerQueryDto): Promise<string> {
    // Export tanpa pagination limit — ambil semua data
    const unlimitedDto = { ...dto, page: 1, pageSize: 10000 };
    const result = await this.queryData(unlimitedDto);
    return stringify(result.data, { header: true });
  }

  async exportExcel(dto: ExplorerQueryDto): Promise<Buffer> {
    const unlimitedDto = { ...dto, page: 1, pageSize: 10000 };
    const result = await this.queryData(unlimitedDto);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(result.data);
    XLSX.utils.book_append_sheet(wb, ws, 'Data Explorer');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }
}
