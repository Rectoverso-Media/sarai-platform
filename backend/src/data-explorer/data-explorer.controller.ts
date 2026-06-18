import { Controller, Get, Post, Body, Res, UseGuards, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DataExplorerService } from './data-explorer.service';
import { ExplorerQueryDto } from './dto/explorer-query.dto';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

@ApiTags('Data Explorer')
@ApiBearerAuth('JWT-auth')
@Controller('data-explorer')
@UseGuards(AuthGuard('jwt'))
export class DataExplorerController {
  constructor(private readonly dataExplorerService: DataExplorerService) {}

  /** GET /data-explorer/tables — List semua tabel yang tersedia */
  @Get('tables')
  @ApiOperation({ summary: 'List semua tabel yang tersedia (synced, managed, query executions)' })
  @ApiResponse({ status: 200, description: 'Daftar tabel berhasil diambil' })
  listTables() {
    return this.dataExplorerService.listAvailableTables();
  }

  /** POST /data-explorer/query — Query data dengan filter & sort */
  @Post('query')
  @ApiOperation({ summary: 'Query data dengan filter, sort, dan pagination' })
  @ApiResponse({ status: 200, description: 'Hasil query berhasil diambil' })
  queryData(@Body() dto: ExplorerQueryDto) {
    return this.dataExplorerService.queryData(dto);
  }

  /** POST /data-explorer/export/csv — Export ke CSV */
  @Post('export/csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="data-export.csv"')
  @ApiOperation({ summary: 'Export hasil data explorer ke file CSV' })
  @ApiResponse({ status: 200, description: 'File CSV berhasil di-generate' })
  async exportCsv(@Body() dto: ExplorerQueryDto, @Res() res: Response) {
    const csv = await this.dataExplorerService.exportCsv(dto);
    return res.send(csv);
  }

  /** POST /data-explorer/export/excel — Export ke Excel */
  @Post('export/excel')
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Header('Content-Disposition', 'attachment; filename="data-export.xlsx"')
  @ApiOperation({ summary: 'Export hasil data explorer ke file Excel (.xlsx)' })
  @ApiResponse({ status: 200, description: 'File Excel berhasil di-generate' })
  async exportExcel(@Body() dto: ExplorerQueryDto, @Res() res: Response) {
    const buffer = await this.dataExplorerService.exportExcel(dto);
    return res.send(buffer);
  }
}
