import { Controller, Get, Param, Res, Header } from '@nestjs/common';
import type { Response } from 'express';
import { ExportService } from './export.service';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  // ENDPOINT: http://localhost:3001/export/csv/USER_TOKEN_RAHASIA
  @Get('csv/:token')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="sarai-data-export.csv"')
  async exportCsv(@Param('token') token: string, @Res() res: Response) {
    const csvContent = await this.exportService.getCsvData(token);
    
    // Kirim konten CSV langsung ke stream response
    return res.send(csvContent);
  }
}