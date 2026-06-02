import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);
  private openai: OpenAI;

  constructor(private prisma: PrismaService) {
    // Kita pakai Groq Llama 3 lagi karena gratis dan cepat
    this.openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY, 
      baseURL: 'https://api.groq.com/openai/v1', 
    });
  }

  // Jalankan setiap hari jam 8 pagi (production-ready schedule)
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async generateDailyInsights() {
    this.logger.log('🕵️ Memulai proses deteksi anomali harian (AI Insights)...');

    try {
      // 1. Kumpulkan data mentah dari database
      const totalSources = await this.prisma.dataSource.count();
      const errorSources = await this.prisma.dataSource.count({
        where: { status: 'Error' }
      });
      const totalQueries = await this.prisma.query.count();
      const failedExecutions = await this.prisma.queryExecution.count({
        where: { 
          status: 'FAILED',
          executedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24 jam terakhir
        }
      });

      // Logika deteksi anomali sederhana
      if (totalSources === 0 && totalQueries === 0) {
        this.logger.log('Belum ada data untuk dianalisis. Skip.');
        return;
      }

      // 2. Minta AI menganalisis data tersebut
      const systemPrompt = `Kamu adalah SARAI AI Data Analyst. 
Data sistem hari ini:
- Total sumber data: ${totalSources} (Error: ${errorSources})
- Total query tersimpan: ${totalQueries}
- Query gagal dalam 24 jam terakhir: ${failedExecutions}

Buatlah SATU paragraf ringkasan analitik profesional dalam bahasa Indonesia. 
Jika ada anomali (error tinggi atau banyak kegagalan), berikan peringatan dan saran tindakan.
Jika semua normal, berikan ringkasan positif singkat.`;

      const response = await this.openai.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'system', content: systemPrompt }],
      });

      const aiInsight = response.choices[0]?.message?.content;

      if (!aiInsight) {
        this.logger.warn('AI tidak menghasilkan insight. Skip penyimpanan.');
        return;
      }

      // 3. Cari atau buat konfigurasi insight default
      let insightConfig = await this.prisma.insightConfig.findFirst();
      if (!insightConfig) {
        insightConfig = await this.prisma.insightConfig.create({
          data: {
            targetTable: 'system',
            metric: 'daily_health_check',
            frequency: 'daily',
          }
        });
      }

      // 4. Simpan hasil insight ke database agar bisa ditampilkan di frontend
      await this.prisma.insightResult.create({
        data: {
          configId: insightConfig.id,
          insightText: aiInsight,
        }
      });

      this.logger.log('✅ AI Insight berhasil disimpan ke database!');

    } catch (error) {
      this.logger.error('Gagal men-generate AI Insights', error);
    }
  }

  // Ambil riwayat insight terbaru (untuk endpoint GET /insights)
  async getLatestInsights(limit = 10) {
    return this.prisma.insightResult.findMany({
      orderBy: { generatedAt: 'desc' },
      take: limit,
    });
  }
}