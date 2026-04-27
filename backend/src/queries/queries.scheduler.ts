import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { QueriesService } from './queries.service';

@Injectable()
export class QueriesScheduler {
  private readonly logger = new Logger(QueriesScheduler.name);

  // inject QueriesService biar robot bisa masukin tugas ke antrean BullMQ
  constructor(private readonly queriesService: QueriesService) {}

  // ⏰ @Cron adalah jam wekernya. 
  // Untuk testing, set EVERY_MINUTE (tiap 1 menit jalan).
  // Nanti di dunia nyata, bisa diganti jadi EVERY_DAY_AT_MIDNIGHT, dll.
  @Cron(CronExpression.EVERY_MINUTE)
  async handleAutomaticQueries() {
    this.logger.debug('🤖 [CRON ROBOT] Bangun tidur! Waktunya kerja otomatis...');
    
    // Simulasi: Di dunia nyata, di sini kita query ke PostgreSQL nyari jadwal yang aktif
    const dummyQueryId = `Q-AUTO-${Date.now()}`;
    const dummySql = "SELECT * FROM daily_summary_table LIMIT 100;";

    this.logger.debug(`📤 Mengirim jadwal Query [${dummyQueryId}] ke antrean pekerja...`);

    // Robot langsung melempar tugas ke antrean Redis Upstash yang tadi kita buat!
    await this.queriesService.triggerQueryExecution(dummyQueryId, dummySql);

    this.logger.debug('✅ Robot selesai nge-lempar tugas. Tidur lagi zzz...');
  }
}