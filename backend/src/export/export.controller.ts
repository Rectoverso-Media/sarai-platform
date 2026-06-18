import { Controller, Get, Param, Res, Header, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { ExportService } from './export.service';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Export')
@ApiBearerAuth('JWT-auth')
@Controller('export')
@UseGuards(AuthGuard('jwt')) // ✅ SECURITY FIX: Semua endpoint export harus authenticated
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  // GET /export/csv — Export DataSources sebagai CSV (protected)
  @Get('csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="sarai-data-export.csv"')
  @ApiOperation({ summary: 'Export semua data source sebagai file CSV' })
  @ApiResponse({ status: 200, description: 'File CSV berhasil di-generate' })
  async exportCsv(@Res() res: Response) {
    const csvContent = await this.exportService.getCsvData();
    return res.send(csvContent);
  }

  // GET /export/csv/query/:queryId — Export hasil query tertentu sebagai CSV
  @Get('csv/query/:queryId')
  @Header('Content-Type', 'text/csv')
  @ApiOperation({ summary: 'Export hasil query tertentu sebagai file CSV' })
  @ApiResponse({ status: 200, description: 'File CSV berhasil di-generate' })
  @ApiResponse({ status: 404, description: 'Query tidak ditemukan atau belum dieksekusi' })
  async exportQueryCsv(
    @Param('queryId') queryId: string,
    @Res() res: Response,
    @Query('filename') filename?: string,
  ) {
    const csvContent = await this.exportService.getQueryResultCsv(queryId);
    const safeFilename = filename
      ? `${filename.replace(/[^a-z0-9-_]/gi, '_')}.csv`
      : `query-${queryId.substring(0, 8)}-export.csv`;

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeFilename}"`,
    );
    return res.send(csvContent);
  }
}