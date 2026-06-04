import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { QueriesService } from './queries.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class QueriesScheduler {
  private readonly logger = new Logger(QueriesScheduler.name);

  constructor(
    private readonly queriesService: QueriesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Setiap menit, robot ini cek semua QuerySchedule yang aktif.
   * Jika cron expression schedule cocok dengan waktu sekarang -> trigger eksekusi.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleAutomaticQueries() {
    this.logger.debug('[CRON ROBOT] Cek jadwal query otomatis...');

    const activeSchedules = await this.queriesService.getActiveSchedules();
    if (!activeSchedules.length) {
      this.logger.debug('Tidak ada jadwal aktif saat ini.');
      return;
    }

    const now = new Date();
    this.logger.debug(`Ditemukan ${activeSchedules.length} jadwal aktif — cek yang harus dijalankan...`);

    for (const schedule of activeSchedules) {
      if (!schedule.query || !schedule.query.rawSql) continue;

      if (!this.shouldRunNow(schedule.cronExpression, now)) continue;

      this.logger.log(`Menjalankan scheduled query: "${schedule.query.name}" [${schedule.queryId}]`);

      try {
        await this.queriesService.executeQuery(schedule.queryId);
        await this.queriesService.updateScheduleRunTime(schedule.id);
        this.logger.log(`Scheduled query [${schedule.queryId}] berhasil di-trigger`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`Gagal trigger scheduled query [${schedule.queryId}]: ${errorMessage}`);

        if (schedule.query.createdById) {
          try {
            await this.notificationsService.createNotification(
              schedule.query.createdById,
              'Jadwal Query Gagal',
              `Scheduled query "${schedule.query.name}" gagal dijalankan. Error: ${errorMessage.substring(0, 150)}`,
            );
          } catch (notifError) {
            this.logger.warn(`Gagal kirim notifikasi schedule failure untuk query ${schedule.queryId}`);
          }
        }
      }
    }
  }

  /**
   * Cek apakah cron expression cocok dengan waktu sekarang.
   * Format: "menit jam hari-bulan bulan hari-minggu"
   * Contoh: "0 asterisk asterisk asterisk asterisk" = setiap jam tepat,
   *         "0 0 asterisk asterisk asterisk" = tengah malam setiap hari
   */
  private shouldRunNow(cronExpression: string, now: Date): boolean {
    try {
      const parts = cronExpression.trim().split(/\s+/);
      if (parts.length !== 5) return false;

      const [minutePart, hourPart, domPart, monthPart, dowPart] = parts;

      const matches = (part: string, value: number): boolean => {
        if (part === '*') return true;
        if (part.startsWith('*/')) {
          const step = parseInt(part.slice(2), 10);
          return !isNaN(step) && value % step === 0;
        }
        const parsed = parseInt(part, 10);
        return !isNaN(parsed) && parsed === value;
      };

      return (
        matches(minutePart, now.getMinutes()) &&
        matches(hourPart, now.getHours()) &&
        matches(domPart, now.getDate()) &&
        matches(monthPart, now.getMonth() + 1) &&
        matches(dowPart, now.getDay())
      );
    } catch {
      return false;
    }
  }
}