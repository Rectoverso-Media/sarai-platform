import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { QueriesService } from './queries.service';

@Processor('query-execution')
export class QueryProcessor extends WorkerHost {
  private readonly logger = new Logger(QueryProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly queriesService: QueriesService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { rawSql, queryId, executionId, teamId, createdById } = job.data;
    this.logger.log(`🚀 Memproses query [${queryId}] — Job ID: ${job.id}`);

    const start = Date.now();

    try {
      // ── EKSEKUSI SQL NYATA KE POSTGRESQL ────────────────────────────────
      const rawResult: any[] = await this.prisma.$queryRawUnsafe(rawSql);
      const durationMs = Date.now() - start;

      this.logger.log(`✅ Query [${queryId}] selesai — ${rawResult.length} baris, ${durationMs}ms`);

      // ── FORMAT HASIL UNTUK FRONTEND ───────────────────────────────────
      let columns: string[] = [];
      let rows: any[] = [];

      if (rawResult && rawResult.length > 0) {
        columns = Object.keys(rawResult[0]);
        rows = rawResult.map((row) => Object.values(row));
      }

      const result = {
        status: 'success',
        columns,
        rows,
        rowCount: rawResult.length,
        executedAt: new Date().toISOString(),
        durationMs,
      };

      // ── UPDATE QueryExecution DI DB ──────────────────────────────────
      if (executionId) {
        await this.prisma.queryExecution.update({
          where: { id: executionId },
          data: {
            status: 'SUCCESS',
            durationMs,
            rowsReturned: rawResult.length,
          },
        });
      }

      // ── SIMPAN HASIL KE REDIS CACHE ───────────────────────────────────
      await this.queriesService.cacheQueryResult(queryId, result);

      return result;
    } catch (error) {
      const durationMs = Date.now() - start;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error(`❌ Query [${queryId}] GAGAL: ${errorMessage}`);

      // ── UPDATE QueryExecution SEBAGAI FAILED ─────────────────────────
      if (executionId) {
        await this.prisma.queryExecution.update({
          where: { id: executionId },
          data: {
            status: 'FAILED',
            durationMs,
            errorMessage,
          },
        });
      }

      // ── KIRIM NOTIFIKASI FAILURE KE USER (jika ada createdById) ──────
      if (createdById) {
        try {
          await this.notificationsService.createNotification(
            createdById,
            '❌ Query Gagal Dieksekusi',
            `Query ID: ${queryId} gagal. Error: ${errorMessage.substring(0, 200)}`,
          );
        } catch (notifError) {
          this.logger.warn(`Gagal kirim notifikasi failure untuk query ${queryId}`);
        }
      }

      return {
        status: 'failed',
        error: `Gagal mengeksekusi SQL. Detail: ${errorMessage}`,
        durationMs,
      };
    }
  }
}