import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { google } from 'googleapis';
import * as path from 'path';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class DataTransfersService {
  private readonly logger = new Logger(DataTransfersService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── AUTH ──────────────────────────────────────────────────────────────────
  private getAuthClient() {
    try {
      const keyFilePath = path.join(process.cwd(), 'google-credentials.json');
      return new google.auth.GoogleAuth({
        keyFile: keyFilePath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } catch (error) {
      throw new HttpException(
        'Kunci Google belum di-setup',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ── SOURCE DATA FETCHER ───────────────────────────────────────────────────
  /**
   * Ambil data + header dari sumber yang dikonfigurasi.
   * Returns { columns: string[], rows: any[][] }
   */
  private async fetchSourceData(config: any): Promise<{
    columns: string[];
    rows: any[][];
  }> {
    const sourceType: string = config.sourceType || 'datasource';

    if (sourceType === 'query') {
      // Ambil hasil eksekusi sukses terakhir dari QueryExecution
      const lastExec = await this.prisma.queryExecution.findFirst({
        where: { queryId: config.queryId, status: 'SUCCESS' },
        orderBy: { executedAt: 'desc' },
      });
      if (!lastExec) {
        throw new HttpException(
          'Belum ada hasil query yang sukses untuk transfer ini',
          HttpStatus.BAD_REQUEST,
        );
      }
      // Result tersimpan di Redis; untuk Transfer kita fallback ke data source
      // Sementara kembalikan data dataSource sebagai demo
      return this.fetchDataSourceRows();
    }

    if (sourceType === 'blend') {
      // Ambil blend config dari DB, lakukan in-memory join
      const blend = await this.prisma.blend.findUnique({
        where: { id: config.blendId },
        include: { sources: { include: { dataSource: true } } },
      });
      if (!blend) {
        throw new HttpException('Blend tidak ditemukan', HttpStatus.NOT_FOUND);
      }
      // Ambil data dari synced_data untuk masing-masing source, lalu gabung
      // Untuk MVP: kembalikan data source pertama
      return this.fetchDataSourceRows();
    }

    // default: datasource → ambil semua data dari dataSource table
    return this.fetchDataSourceRows();
  }

  private async fetchDataSourceRows(): Promise<{
    columns: string[];
    rows: any[][];
  }> {
    const allSources = await this.prisma.dataSource.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const columns = ['ID', 'Nama Koneksi', 'Tipe', 'Status', 'Dibuat'];
    const rows = allSources.map((s) => [
      s.id.substring(0, 8),
      s.name,
      s.connectorName || s.sourceType,
      s.status,
      s.createdAt.toISOString(),
    ]);
    return { columns, rows };
  }

  // ── GOOGLE SHEETS WRITER ──────────────────────────────────────────────────
  private async writeToSheet(
    spreadsheetId: string,
    sheetName: string,
    columns: string[],
    rows: any[][],
    writeMode: 'append' | 'replace' | 'update',
  ) {
    const auth = this.getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const range = `${sheetName}!A1`;

    if (writeMode === 'replace') {
      // Kosongkan sheet dulu, lalu tulis ulang dari baris 1
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: sheetName,
      });
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [columns, ...rows] },
      });
      return rows.length;
    }

    if (writeMode === 'update') {
      // Ambil data yang ada, match baris berdasarkan kolom pertama (key)
      const existing = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: sheetName,
      });
      const existingRows = existing.data.values || [];
      const keyMap = new Map<string, number>();
      existingRows.forEach((row, idx) => {
        if (idx > 0 && row[0]) keyMap.set(String(row[0]), idx + 1); // 1-indexed
      });

      const newRowsToAppend: any[][] = [];
      for (const row of rows) {
        const key = String(row[0]);
        if (keyMap.has(key)) {
          // Update baris yang sudah ada
          const rowNum = keyMap.get(key)!;
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${sheetName}!A${rowNum}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [row] },
          });
        } else {
          newRowsToAppend.push(row);
        }
      }
      if (newRowsToAppend.length > 0) {
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: newRowsToAppend },
        });
      }
      return rows.length;
    }

    // Default: append
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [columns, ...rows] },
    });
    return response.data.updates?.updatedCells || rows.length;
  }

  // ── EXCEL EXPORT ──────────────────────────────────────────────────────────
  async exportToExcel(transferId: string): Promise<Buffer> {
    const config = await this.prisma.transfer.findUnique({
      where: { id: transferId },
    });
    if (!config) {
      throw new HttpException('Transfer tidak ditemukan', HttpStatus.NOT_FOUND);
    }

    const cfg = config.configData as any;
    const { columns, rows } = await this.fetchSourceData(cfg);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SARAI Platform';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(cfg.sheetName || 'Data');

    // Header row dengan styling
    const headerRow = sheet.addRow(columns);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3B82F6' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Data rows
    rows.forEach((row) => sheet.addRow(row));

    // Auto-fit columns
    sheet.columns.forEach((column) => {
      column.width = Math.max(
        ...(column.values || []).map((v) => String(v ?? '').length),
        10,
      );
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  async createTransfer(data: {
    name: string;
    sourceId: string;
    sourceType?: string;
    queryId?: string;
    blendId?: string;
    targetType?: string;
    spreadsheetId?: string;
    sheetName?: string;
    writeMode?: string;
    scheduleExpression?: string;
  }) {
    return this.prisma.transfer.create({
      data: {
        name: data.name,
        sourceId: data.sourceId,
        targetType: data.targetType || 'Google Sheets',
        configData: {
          sourceType: data.sourceType || 'datasource',
          queryId: data.queryId,
          blendId: data.blendId,
          spreadsheetId: data.spreadsheetId,
          sheetName: data.sheetName || 'Sheet1',
          writeMode: data.writeMode || 'append',
          scheduleExpression: data.scheduleExpression,
        },
      },
    });
  }

  async getAllTransfers() {
    return this.prisma.transfer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        source: { select: { id: true, name: true, sourceType: true } },
        executions: {
          orderBy: { executedAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async getTransferById(id: string) {
    const transfer = await this.prisma.transfer.findUnique({
      where: { id },
      include: {
        source: { select: { id: true, name: true, sourceType: true } },
        executions: { orderBy: { executedAt: 'desc' }, take: 10 },
      },
    });
    if (!transfer) {
      throw new HttpException('Transfer tidak ditemukan', HttpStatus.NOT_FOUND);
    }
    return transfer;
  }

  async getTransferHistory(id: string) {
    return this.prisma.transferExecution.findMany({
      where: { transferId: id },
      orderBy: { executedAt: 'desc' },
      take: 20,
    });
  }

  async deleteTransfer(id: string) {
    await this.prisma.transfer.delete({ where: { id } });
    return { message: 'Transfer berhasil dihapus' };
  }

  async updateSchedule(id: string, scheduleExpression: string) {
    const transfer = await this.prisma.transfer.findUnique({ where: { id } });
    if (!transfer) {
      throw new HttpException('Transfer tidak ditemukan', HttpStatus.NOT_FOUND);
    }
    const updated = await this.prisma.transfer.update({
      where: { id },
      data: {
        configData: {
          ...(transfer.configData as object),
          scheduleExpression,
        },
      },
    });
    return { message: 'Jadwal transfer berhasil diperbarui', data: updated };
  }

  // ── EXECUTE ───────────────────────────────────────────────────────────────
  async executeTransfer(transferId: string) {
    const config = await this.prisma.transfer.findUnique({
      where: { id: transferId },
      include: { source: true },
    });
    if (!config) {
      throw new HttpException('Transfer tidak ditemukan', HttpStatus.NOT_FOUND);
    }

    const cfg = config.configData as any;
    const startTime = Date.now();

    try {
      const { columns, rows } = await this.fetchSourceData(cfg);

      const writeMode: 'append' | 'replace' | 'update' =
        cfg.writeMode || 'append';

      await this.writeToSheet(
        cfg.spreadsheetId,
        cfg.sheetName || 'Sheet1',
        columns,
        rows,
        writeMode,
      );

      // Log eksekusi sukses
      await this.prisma.transferExecution.create({
        data: {
          transferId,
          status: 'SUCCESS',
          recordsMoved: rows.length,
        },
      });

      return {
        message: `Transfer sukses! ${rows.length} baris dipindahkan ke Google Sheets (mode: ${writeMode})`,
        recordsMoved: rows.length,
        writeMode,
        durationMs: Date.now() - startTime,
      };
    } catch (error: any) {
      await this.prisma.transferExecution.create({
        data: {
          transferId,
          status: 'FAILED',
          recordsMoved: 0,
        },
      });
      throw new HttpException(
        `Transfer gagal: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ── SCHEDULER ─────────────────────────────────────────────────────────────
  @Cron(CronExpression.EVERY_MINUTE)
  async runScheduledTransfers() {
    const transfers = await this.prisma.transfer.findMany();
    const now = new Date();

    for (const transfer of transfers) {
      const cfg = transfer.configData as any;
      if (!cfg?.scheduleExpression) continue;

      // Simple check: kalau scheduleExpression adalah "@hourly" dsb, cek setiap jam
      // Untuk MVP: jalankan jika scheduleExpression === '@every_minute' (testing)
      // Production: pakai cron parser yang proper
      if (cfg.scheduleExpression === '@every_minute') {
        this.logger.log(
          `⏰ Menjalankan scheduled transfer: ${transfer.name}`,
        );
        try {
          await this.executeTransfer(transfer.id);
        } catch (err: any) {
          this.logger.error(
            `Scheduled transfer ${transfer.id} gagal: ${err.message}`,
          );
        }
      }
    }
  }
}