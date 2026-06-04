import { Controller, Get, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { QueriesService } from './queries.service';

@Controller('bi-connector')
export class BiConnectorController {
  constructor(private readonly queriesService: QueriesService) {}

  // ENDPOINT: GET /bi-connector/export/:queryId?apiKey=RAHASIA
  @Get('export/:queryId')
  async exportToBi(
    @Param('queryId') queryId: string,
    @Query('apiKey') apiKey: string,
  ) {
    // 1. Pengecekan API Key khusus Mesin BI
    if (apiKey !== 'SARAI_BI_SECRET_2026') {
      throw new HttpException('Akses Ditolak: API Key tidak valid', HttpStatus.UNAUTHORIZED);
    }

    try {
      // 2. Trigger eksekusi query ke BullMQ queue
      const execResult = await this.queriesService.executeQuery(queryId);

      // 3. Poll job status (tunggu hingga selesai, max 30 detik)
      if (execResult.jobId) {
        let attempts = 0;
        while (attempts < 30) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const jobStatus = await this.queriesService.getJobStatus(String(execResult.jobId));
          if (jobStatus.state === 'completed' && jobStatus.result?.columns) {
            // Power BI & Looker Studio butuh format Array of Objects
            const { columns, rows } = jobStatus.result as { columns: string[]; rows: any[][] };
            return rows.map((row: any[]) =>
              Object.fromEntries(columns.map((col: string, i: number) => [col, row[i]])),
            );
          }
          if (jobStatus.state === 'failed') {
            throw new HttpException('Eksekusi query gagal', HttpStatus.INTERNAL_SERVER_ERROR);
          }
          attempts++;
        }
      }

      // Fallback: return empty array jika timeout
      return [];
    } catch (error: any) {
      console.error('BI Connector Error:', error);
      throw new HttpException('Gagal menarik data untuk BI', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}