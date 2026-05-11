import { Controller, Get, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { QueriesService } from './queries.service'; 

@Controller('bi-connector')
export class BiConnectorController {
  constructor(private readonly queriesService: QueriesService) {}

  // ENDPOINT: GET /bi-connector/export/:queryId?apiKey=RAHASIA
  @Get('export/:queryId')
  async exportToBi(
    @Param('queryId') queryId: string,
    @Query('apiKey') apiKey: string
  ) {
    // 1. Pengecekan KTP khusus Mesin BI (Biar data klien nggak bocor ke publik)
    // Di real production, apiKey ini dicocokkan dengan tabel User/Workspace
    if (apiKey !== 'SARAI_BI_SECRET_2026') {
      throw new HttpException('Akses Ditolak: API Key tidak valid', HttpStatus.UNAUTHORIZED);
    }

    try {
      // 2. Jalankan mesin query yang udah kamu buat sebelumnya
      const result = await this.queriesService.executeQuery(queryId);

      // 3. Power BI & Looker Studio SANGAT BENCI metadata yang ribet.
      // Jadi, kita JANGAN me-return message atau executionLog.
      // KITA HANYA ME-RETURN ISI DATANYA SAJA (Array of Objects).
      return result.previewData; 

    } catch (error: any) {
      console.error('BI Connector Error:', error);
      throw new HttpException('Gagal menarik data untuk BI', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}