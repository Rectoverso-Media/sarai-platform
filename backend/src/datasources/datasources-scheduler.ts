import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TrialService } from './trial.service';

@Injectable()
export class DatasourcesScheduler {
  private readonly logger = new Logger(DatasourcesScheduler.name);

  constructor(private readonly trialService: TrialService) {}

  /**
   * Setiap tengah malam (00:00 WIB / 17:00 UTC) — cek semua trial yang sudah expired
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleTrialExpiry() {
    this.logger.log('🕛 [Cron] Memulai pengecekan trial expiry...');
    try {
      await this.trialService.checkTrialExpiry();
      this.logger.log('✅ [Cron] Pengecekan trial expiry selesai.');
    } catch (error: any) {
      this.logger.error(`❌ [Cron] Gagal cek trial expiry: ${error.message}`);
    }
  }
}
