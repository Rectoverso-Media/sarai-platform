import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  UseGuards,
  Header,
} from '@nestjs/common';
import { DataExplorerService } from './data-explorer.service';
import { ExplorerQueryDto } from './dto/explorer-query.dto';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

@Controller('data-explorer')
@UseGuards(AuthGuard('jwt'))
export class DataExplorerController {
  constructor(private readonly dataExplorerService: DataExplorerService) {}

  /** GET /data-explorer/tables — List semua tabel yang tersedia */
  @Get('tables')
  listTables() {
    return this.dataExplorerService.listAvailableTables();
  }

  /** POST /data-explorer/query — Query data dengan filter & sort */
  @Post('query')
  queryData(@Body() dto: ExplorerQueryDto) {
    return this.dataExplorerService.queryData(dto);
  }

  /** POST /data-explorer/export/csv — Export ke CSV */
  @Post('export/csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="data-export.csv"')
  async exportCsv(@Body() dto: ExplorerQueryDto, @Res() res: Response) {
    const csv = await this.dataExplorerService.exportCsv(dto);
    return res.send(csv);
  }

  /** POST /data-explorer/export/excel — Export ke Excel */
  @Post('export/excel')
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Header('Content-Disposition', 'attachment; filename="data-export.xlsx"')
  async exportExcel(@Body() dto: ExplorerQueryDto, @Res() res: Response) {
    const buffer = await this.dataExplorerService.exportExcel(dto);
    return res.send(buffer);
  }
}
