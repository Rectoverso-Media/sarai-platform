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

  // ⚡ Untuk testing, kita jalankan SETIAP MENIT dulu. 
  // Nanti kalau udah jalan, ganti jadi CronExpression.EVERY_DAY_AT_8AM
  @Cron(CronExpression.EVERY_MINUTE)
  async generateDailyInsights() {
    this.logger.log('🕵️ Memulai proses deteksi anomali (AI Insights)...');

    try {
      // 1. Kumpulkan data mentah (Contoh: Status Data Source)
      const totalSources = await this.prisma.dataSource.count();
      const errorSources = await this.prisma.dataSource.count({
        where: { status: 'Error' }
      });

      // Logika deteksi anomali sederhana
      if (totalSources === 0) {
        this.logger.log('Belum ada data untuk dianalisis.');
        return;
      }

      // 2. Minta AI menganalisis data tersebut
      const systemPrompt = `Kamu adalah SARAI AI Data Analyst. 
Sistem mendeteksi saat ini ada ${errorSources} sumber data yang error dari total ${totalSources} sumber.
Buatlah SATU paragraf peringatan profesional dalam bahasa Indonesia mengenai anomali ini.
Berikan saran tindakan untuk teknisi.`;

      const response = await this.openai.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'system', content: systemPrompt }],
      });

      const aiInsight = response.choices[0]?.message?.content;

      // 3. Outputkan hasil AI Insight-nya!
      // Nanti ini bisa dikirim ke Frontend via SSE, Disimpan di tabel Notification, atau dikirim via Email.
      this.logger.log(`💡 HASIL AI INSIGHT: \n${aiInsight}`);

    } catch (error) {
      this.logger.error('Gagal men-generate AI Insights', error);
    }
  }
}