import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; 
import OpenAI from 'openai';
import { Observable, Subscriber } from 'rxjs';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(private prisma: PrismaService) {
    this.openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY, 
      baseURL: 'https://api.groq.com/openai/v1', 
      // apiKey: process.env.OPENAI_API_KEY, 
      
    });
  }

  streamChatResponse(userMessage: string): Observable<any> {
    return new Observable((subscriber) => {
      this.executeContextAwareStream(userMessage, subscriber);
    });
  }

  private async executeContextAwareStream(userMessage: string, subscriber: Subscriber<any>) {
    try {
      console.log(`🤖 Menerima pesan: "${userMessage}"`);
      console.log('🔍 Mengumpulkan konteks dari database...');

      const totalSources = await this.prisma.dataSource.count();
      const connectedSources = await this.prisma.dataSource.count({
        where: { status: 'Connected' }
      });
      const totalQueries = await this.prisma.query.count();
      const totalUsers = await this.prisma.user.count();

      const systemPrompt = `Kamu adalah SARAI, asisten AI pintar untuk platform analitik data terintegrasi. 
Kamu memiliki akses ke metrik sistem real-time berikut:
- Total pengguna terdaftar: ${totalUsers}
- Total Data Source (Sumber Data): ${totalSources} (Di mana ${connectedSources} berstatus 'Connected')
- Total Query tersimpan: ${totalQueries}

Tugasmu:
1. Jawab pertanyaan pengguna menggunakan data di atas jika relevan.
2. Jika pengguna bertanya hal di luar data tersebut, jawab berdasarkan pengetahuan umummu tentang data engineering dan analytics.
3. Selalu gunakan bahasa Indonesia yang profesional, ringkas, dan mudah dipahami.`;

      console.log('⚡ Menghubungkan ke OpenAI API...');

      const stream = await this.openai.chat.completions.create({
        // 👇 Menggunakan model andalan OpenAI yang cepat dan cerdas
        model: 'llama-3.1-8b-instant', 
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        stream: true, 
      });

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) {
          subscriber.next({ data: { text: text } });
        }
      }

      subscriber.next({ data: { status: 'DONE' } });
      subscriber.complete();
      console.log('✅ Selesai streaming balasan cerdas dari OpenAI!');

    } catch (error) {
      console.error('AI Context Stream Error:', error);
      subscriber.error(new InternalServerErrorException('Gagal memproses AI response dari OpenAI'));
    }
  }
}