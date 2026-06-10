import {
  Controller,
  Post,
  Body,
  UseGuards,
  Res,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ExcelService } from './excel.service';
import { PrismaService } from '../../prisma/prisma.service';

class ExportToExcelDto {
  queryId?: string;      // Ambil data dari QueryExecution tertentu
  sheetName?: string;    // Nama sheet dalam file (default: 'Export')
  title?: string;        // Judul baris pertama (opsional)
  filename?: string;     // Nama file download (opsional)
}

@Controller('integrations/excel')
@UseGuards(AuthGuard('jwt'))
export class ExcelController {
  constructor(
    private readonly excelService: ExcelService,
    private readonly prisma: PrismaService,
  ) {}

  // POST /integrations/excel/export — Generate & download .xlsx
  @Post('export')
  async exportToExcel(@Body() dto: ExportToExcelDto, @Res() res: Response) {
    let columns: string[] = [];
    let rows: any[] = [];
    const sheetName = dto.sheetName || 'SARAI Export';

    if (dto.queryId) {
      const execution = await this.prisma.queryExecution.findFirst({
        where: { queryId: dto.queryId, status: 'SUCCESS' },
        orderBy: { executedAt: 'desc' },
        include: { query: { select: { name: true } } },
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
        rows = snapshot;
      } else {
        throw new BadRequestException('Format hasil query tidak dapat diproses.');
      }
    } else {
      // Fallback: export data source list
      const dataSources = await this.prisma.dataSource.findMany({
        take: 500,
        orderBy: { createdAt: 'desc' },
      });
      if (dataSources.length === 0) {
        throw new BadRequestException('Tidak ada data untuk diekspor.');
      }
      columns = ['name', 'sourceType', 'status', 'createdAt'];
      rows = dataSources;
    }

    const title =
      dto.title || `SARAI Data Export — ${new Date().toLocaleDateString('id-ID')}`;
    const buffer = await this.excelService.generateExcelBuffer(
      sheetName,
      columns,
      rows,
      title,
    );

    const safeFilename = dto.filename
      ? `${dto.filename.replace(/[^a-z0-9-_]/gi, '_')}.xlsx`
      : `sarai-export-${Date.now()}.xlsx`;

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${safeFilename}"`,
      'Content-Length': buffer.length,
    });

    return res.send(buffer);
  }
}
