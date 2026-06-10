import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GoogleSheetsService, ExportMode } from './google-sheets.service';
import { PrismaService } from '../../prisma/prisma.service';

class ExportToSheetsDto {
  sheetId: string;       // ID dari URL spreadsheet
  tabName: string;       // Nama tab/sheet tujuan
  queryId?: string;      // Opsional: ambil data dari QueryExecution
  mode: ExportMode;      // 'append' | 'replace'
}

@Controller('integrations/sheets')
@UseGuards(AuthGuard('jwt'))
export class GoogleSheetsController {
  constructor(
    private readonly sheetsService: GoogleSheetsService,
    private readonly prisma: PrismaService,
  ) {}

  // POST /integrations/sheets/export
  @Post('export')
  async exportToSheets(@Body() dto: ExportToSheetsDto, @Req() req: any) {
    if (!dto.sheetId?.trim()) {
      throw new BadRequestException('sheetId wajib diisi');
    }
    if (!dto.tabName?.trim()) {
      throw new BadRequestException('tabName wajib diisi');
    }
    if (!['append', 'replace'].includes(dto.mode)) {
      throw new BadRequestException("mode harus 'append' atau 'replace'");
    }

    let columns: string[] = [];
    let rows: any[] = [];

    if (dto.queryId) {
      // Ambil data dari hasil query execution terbaru
      const execution = await this.prisma.queryExecution.findFirst({
        where: { queryId: dto.queryId, status: 'SUCCESS' },
        orderBy: { executedAt: 'desc' },
      });

      if (!execution?.resultSnapshot) {
        throw new BadRequestException(
          'Tidak ada hasil query yang berhasil untuk queryId ini.',
        );
      }

      const snapshot = execution.resultSnapshot as any;

      if (snapshot.columns && Array.isArray(snapshot.rows)) {
        columns = snapshot.columns;
        rows = snapshot.rows;
      } else if (Array.isArray(snapshot) && snapshot.length > 0) {
        columns = Object.keys(snapshot[0]);
        rows = snapshot.map((item: any) => columns.map((c) => item[c]));
      } else {
        throw new BadRequestException('Format hasil query tidak dapat diproses.');
      }
    } else {
      // Fallback: export DataSources jika tidak ada queryId
      const dataSources = await this.prisma.dataSource.findMany({
        take: 500,
        orderBy: { createdAt: 'desc' },
      });
      if (dataSources.length === 0) {
        throw new BadRequestException('Tidak ada data untuk diekspor.');
      }
      columns = Object.keys(dataSources[0]).filter((k) => k !== 'id');
      rows = dataSources.map((ds: any) => columns.map((c) => ds[c]));
    }

    return this.sheetsService.exportData(
      dto.sheetId,
      dto.tabName,
      columns,
      rows,
      dto.mode,
    );
  }
}
