import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { InsightType } from '@prisma/client';
import OpenAI from 'openai';

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);
  private openai: OpenAI;

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }

  // ================================================================
  // CRON JOBS — Otomatis berjalan terjadwal
  // ================================================================

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async runDailyInsights() {
    this.logger.log('🕰️ Menjalankan semua daily insights...');
    await Promise.allSettled([
      this.generateAnomalyDetection(),
      this.generateTrendAnalysis(),
    ]);
  }

  @Cron('0 8 * * 1') // Setiap Senin jam 08:00
  async runWeeklyInsights() {
    this.logger.log('🕰️ Menjalankan weekly insights...');
    await Promise.allSettled([
      this.generatePeriodComparison(),
      this.generateForecast(),
    ]);
  }

  // ================================================================
  // 1. ANOMALY DETECTION
  // ================================================================
  async generateAnomalyDetection() {
    this.logger.log('🔍 Generating: Anomaly Detection...');
    try {
      const totalSources = await this.prisma.dataSource.count();
      const errorSources = await this.prisma.dataSource.count({
        where: { status: 'Error' },
      });
      const failedQueries = await this.prisma.queryExecution.count({
        where: {
          status: 'FAILED',
          executedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });
      const totalQueries = await this.prisma.queryExecution.count({
        where: {
          executedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      const errorRate =
        totalSources > 0 ? (errorSources / totalSources) * 100 : 0;
      const failureRate =
        totalQueries > 0 ? (failedQueries / totalQueries) * 100 : 0;

      const prompt = `Kamu adalah SARAI AI Analyst. Analisis data anomali berikut dan buat 1 paragraf ringkasan profesional dalam bahasa Indonesia:

Data sistem 24 jam terakhir:
- Total data source: ${totalSources} (${errorSources} error, error rate: ${errorRate.toFixed(1)}%)
- Total eksekusi query: ${totalQueries} (${failedQueries} gagal, failure rate: ${failureRate.toFixed(1)}%)

Kriteria anomali:
- KRITIS jika error rate > 20% atau failure rate > 30%
- WASPADA jika error rate 10-20% atau failure rate 15-30%
- NORMAL jika di bawah threshold tersebut

Berikan: status kesehatan sistem, analisis anomali yang ditemukan, dan rekomendasi tindakan jika ada anomali.`;

      const text = await this.callAI(prompt);
      if (!text) return;

      const config = await this.ensureConfig(
        InsightType.ANOMALY_DETECTION,
        'daily',
      );
      const result = await this.prisma.insightResult.create({
        data: {
          configId: config.id,
          insightType: InsightType.ANOMALY_DETECTION,
          insightText: text,
          metadata: { errorRate, failureRate, totalSources, totalQueries },
        },
      });

      await this.notifyUsers(
        InsightType.ANOMALY_DETECTION,
        errorRate > 10 || failureRate > 15
          ? `⚠️ Anomali Terdeteksi: Error rate ${errorRate.toFixed(1)}%`
          : '✅ Sistem Normal: Tidak ada anomali signifikan',
      );

      this.logger.log('✅ Anomaly Detection insight tersimpan');
      return result;
    } catch (error) {
      this.logger.error('Gagal generate Anomaly Detection:', error);
    }
  }

  // ================================================================
  // 2. TREND ANALYSIS
  // ================================================================
  async generateTrendAnalysis() {
    this.logger.log('📈 Generating: Trend Analysis...');
    try {
      const now = new Date();
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const prev7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      // Hitung query executions per periode
      const currentPeriodQueries = await this.prisma.queryExecution.count({
        where: { executedAt: { gte: last7Days } },
      });
      const prevPeriodQueries = await this.prisma.queryExecution.count({
        where: {
          executedAt: { gte: prev7Days, lt: last7Days },
        },
      });

      // Hitung synced rows per periode
      const currentSyncedRows = await this.prisma.syncedData.count({
        where: { syncedAt: { gte: last7Days } },
      });
      const prevSyncedRows = await this.prisma.syncedData.count({
        where: { syncedAt: { gte: prev7Days, lt: last7Days } },
      });

      // Hitung tren
      const queryTrendPct =
        prevPeriodQueries > 0
          ? ((currentPeriodQueries - prevPeriodQueries) / prevPeriodQueries) *
            100
          : 0;
      const syncTrendPct =
        prevSyncedRows > 0
          ? ((currentSyncedRows - prevSyncedRows) / prevSyncedRows) * 100
          : 0;

      const prompt = `Kamu adalah SARAI AI Analyst. Buat analisis tren 7 hari dalam bahasa Indonesia profesional:

METRIK PEKAN INI (7 hari terakhir):
- Eksekusi query: ${currentPeriodQueries} (${queryTrendPct >= 0 ? '+' : ''}${queryTrendPct.toFixed(1)}% vs pekan lalu)
- Baris data tersync: ${currentSyncedRows} (${syncTrendPct >= 0 ? '+' : ''}${syncTrendPct.toFixed(1)}% vs pekan lalu)

METRIK PEKAN LALU:
- Eksekusi query: ${prevPeriodQueries}
- Baris data tersync: ${prevSyncedRows}

Identifikasi: pola tren yang dominan, apakah platform semakin banyak digunakan, dan berikan insight bisnis yang actionable.`;

      const text = await this.callAI(prompt);
      if (!text) return;

      const config = await this.ensureConfig(
        InsightType.TREND_ANALYSIS,
        'daily',
      );
      const result = await this.prisma.insightResult.create({
        data: {
          configId: config.id,
          insightType: InsightType.TREND_ANALYSIS,
          insightText: text,
          metadata: {
            queryTrendPct,
            syncTrendPct,
            currentPeriodQueries,
            prevPeriodQueries,
            currentSyncedRows,
            prevSyncedRows,
          },
        },
      });

      await this.notifyUsers(
        InsightType.TREND_ANALYSIS,
        `📈 Trend Update: Aktivitas query ${queryTrendPct >= 0 ? 'naik' : 'turun'} ${Math.abs(queryTrendPct).toFixed(1)}% vs pekan lalu`,
      );

      this.logger.log('✅ Trend Analysis insight tersimpan');
      return result;
    } catch (error) {
      this.logger.error('Gagal generate Trend Analysis:', error);
    }
  }

  // ================================================================
  // 3. PERIOD COMPARISON
  // ================================================================
  async generatePeriodComparison() {
    this.logger.log('📊 Generating: Period Comparison...');
    try {
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      );

      const thisMonthQueries = await this.prisma.queryExecution.count({
        where: { executedAt: { gte: startOfThisMonth } },
      });
      const lastMonthQueries = await this.prisma.queryExecution.count({
        where: {
          executedAt: { gte: startOfLastMonth, lt: startOfThisMonth },
        },
      });

      const thisMonthSources = await this.prisma.dataSource.count({
        where: { createdAt: { gte: startOfThisMonth } },
      });
      const lastMonthSources = await this.prisma.dataSource.count({
        where: {
          createdAt: { gte: startOfLastMonth, lt: startOfThisMonth },
        },
      });

      const thisMonthSynced = await this.prisma.syncedData.count({
        where: { syncedAt: { gte: startOfThisMonth } },
      });
      const lastMonthSynced = await this.prisma.syncedData.count({
        where: { syncedAt: { gte: startOfLastMonth, lt: startOfThisMonth } },
      });

      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
      ];
      const thisMonthName = months[now.getMonth()];
      const lastMonthName = months[now.getMonth() === 0 ? 11 : now.getMonth() - 1];

      const prompt = `Kamu adalah SARAI AI Analyst. Buat laporan perbandingan periode bulanan dalam bahasa Indonesia profesional:

BULAN INI (${thisMonthName}):
- Eksekusi query: ${thisMonthQueries}
- Data source baru: ${thisMonthSources}
- Baris data tersync: ${thisMonthSynced}

BULAN LALU (${lastMonthName}):
- Eksekusi query: ${lastMonthQueries}
- Data source baru: ${lastMonthSources}
- Baris data tersync: ${lastMonthSynced}

Buat perbandingan komprehensif, identifikasi area pertumbuhan atau penurunan, dan berikan rekomendasi untuk bulan depan.`;

      const text = await this.callAI(prompt);
      if (!text) return;

      const config = await this.ensureConfig(
        InsightType.PERIOD_COMPARISON,
        'weekly',
      );
      const result = await this.prisma.insightResult.create({
        data: {
          configId: config.id,
          insightType: InsightType.PERIOD_COMPARISON,
          insightText: text,
          metadata: {
            period: `${lastMonthName} vs ${thisMonthName}`,
            thisMonthQueries,
            lastMonthQueries,
            thisMonthSources,
            lastMonthSources,
          },
        },
      });

      await this.notifyUsers(
        InsightType.PERIOD_COMPARISON,
        `📊 Laporan Bulanan: Perbandingan ${lastMonthName} vs ${thisMonthName} siap`,
      );

      this.logger.log('✅ Period Comparison insight tersimpan');
      return result;
    } catch (error) {
      this.logger.error('Gagal generate Period Comparison:', error);
    }
  }

  // ================================================================
  // 4. FORECAST
  // ================================================================
  async generateForecast() {
    this.logger.log('🔮 Generating: Forecast...');
    try {
      // Ambil data 4 minggu terakhir untuk memproyeksikan
      const weeks: { label: string; queries: number; synced: number }[] = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
        const queries = await this.prisma.queryExecution.count({
          where: { executedAt: { gte: weekStart, lt: weekEnd } },
        });
        const synced = await this.prisma.syncedData.count({
          where: { syncedAt: { gte: weekStart, lt: weekEnd } },
        });
        weeks.push({ label: `Minggu -${i + 1}`, queries, synced });
      }

      // Hitung rata-rata tren linear sederhana
      const avgQueryGrowth =
        weeks.length > 1
          ? (weeks[weeks.length - 1].queries - weeks[0].queries) /
            (weeks.length - 1)
          : 0;
      const nextWeekForecast = Math.max(
        0,
        Math.round(weeks[weeks.length - 1].queries + avgQueryGrowth),
      );

      const weeklyData = weeks
        .map((w) => `${w.label}: ${w.queries} query, ${w.synced} baris`)
        .join('\n');

      const prompt = `Kamu adalah SARAI AI Analyst. Buat proyeksi/forecast 1 minggu ke depan dalam bahasa Indonesia profesional:

DATA 4 MINGGU TERAKHIR:
${weeklyData}

PROYEKSI LINEAR SEDERHANA:
- Estimasi query minggu depan: ~${nextWeekForecast}
- Rata-rata pertumbuhan mingguan: ${avgQueryGrowth >= 0 ? '+' : ''}${avgQueryGrowth.toFixed(1)} query/minggu

Berikan: analisis tren historis, proyeksi yang realistis untuk minggu depan, faktor risiko yang perlu diwaspadai, dan rekomendasi kapasitas sistem.`;

      const text = await this.callAI(prompt);
      if (!text) return;

      const config = await this.ensureConfig(InsightType.FORECAST, 'weekly');
      const result = await this.prisma.insightResult.create({
        data: {
          configId: config.id,
          insightType: InsightType.FORECAST,
          insightText: text,
          metadata: { weeks, nextWeekForecast, avgQueryGrowth },
        },
      });

      await this.notifyUsers(
        InsightType.FORECAST,
        `🔮 Forecast: Proyeksi aktivitas minggu depan ~${nextWeekForecast} eksekusi query`,
      );

      this.logger.log('✅ Forecast insight tersimpan');
      return result;
    } catch (error) {
      this.logger.error('Gagal generate Forecast:', error);
    }
  }

  // ================================================================
  // GET ENDPOINTS — Dipakai oleh InsightsController
  // ================================================================

  async getLatestInsights(limit = 10, type?: InsightType) {
    return this.prisma.insightResult.findMany({
      where: type ? { insightType: type } : undefined,
      orderBy: { generatedAt: 'desc' },
      take: limit,
      include: {
        config: { select: { insightType: true, frequency: true } },
      },
    });
  }

  async getInsightsSummary() {
    const [latest, counts] = await Promise.all([
      this.prisma.insightResult.findMany({
        distinct: ['insightType'],
        orderBy: { generatedAt: 'desc' },
        take: 4,
      }),
      this.prisma.insightResult.groupBy({
        by: ['insightType'],
        _count: { id: true },
      }),
    ]);
    return { latest, counts };
  }

  // ================================================================
  // HELPERS
  // ================================================================

  private async callAI(prompt: string): Promise<string | null> {
    const response = await this.openai.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
    });
    return response.choices[0]?.message?.content || null;
  }

  private async ensureConfig(
    insightType: InsightType,
    frequency: string,
  ) {
    let config = await this.prisma.insightConfig.findFirst({
      where: { insightType, isActive: true },
    });

    if (!config) {
      config = await this.prisma.insightConfig.create({
        data: {
          insightType,
          targetTable: 'system',
          metric: insightType.toLowerCase(),
          frequency,
        },
      });
    }

    return config;
  }

  private async notifyUsers(type: InsightType, summary: string) {
    try {
      // Ambil semua user dengan role OWNER atau ADMIN
      const admins = await this.prisma.user.findMany({
        where: { role: { in: ['OWNER', 'ADMIN'] } },
        select: { id: true },
      });

      const notifMap: Record<InsightType, string> = {
        ANOMALY_DETECTION: 'Anomaly Detection',
        TREND_ANALYSIS: 'Trend Analysis',
        PERIOD_COMPARISON: 'Period Comparison',
        FORECAST: 'Forecast',
      };

      await Promise.all(
        admins.map((admin) =>
          this.notifications.createNotification(
            admin.id,
            `AI Insight: ${notifMap[type]}`,
            summary,
          ),
        ),
      );
    } catch (error) {
      this.logger.warn('Gagal kirim notifikasi insight:', error);
    }
  }
}