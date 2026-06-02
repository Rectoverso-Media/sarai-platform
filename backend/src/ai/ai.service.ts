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

      console.log('⚡ Menghubungkan ke Groq API...');

      const stream = await this.openai.chat.completions.create({
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
      console.log('✅ Selesai streaming balasan dari Groq!');

    } catch (error) {
      console.error('AI Context Stream Error:', error);
      subscriber.error(new InternalServerErrorException('Gagal memproses AI response'));
    }
  }

  // ============================================
  // CHAT HISTORY — Simpan & Ambil Percakapan
  // ============================================

  // Buat sesi chat baru
  async createChatSession(userId: string, title?: string) {
    return this.prisma.aiChatSession.create({
      data: {
        userId,
        title: title || `Sesi ${new Date().toLocaleDateString('id-ID')}`,
      },
    });
  }

  // Simpan satu pesan ke sesi chat
  async saveMessage(sessionId: string, role: 'user' | 'assistant', content: string) {
    return this.prisma.aiChatMessage.create({
      data: { sessionId, role, content },
    });
  }

  // Ambil semua sesi chat milik user
  async getChatSessions(userId: string) {
    return this.prisma.aiChatSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        _count: { select: { messages: true } },
      },
    });
  }

  // Ambil pesan dalam satu sesi chat
  async getChatMessages(sessionId: string, userId: string) {
    // Verifikasi sesi milik user yang request
    const session = await this.prisma.aiChatSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) return null;

    return this.prisma.aiChatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Hapus sesi chat beserta semua pesannya
  async deleteChatSession(sessionId: string, userId: string) {
    const session = await this.prisma.aiChatSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) return { message: 'Sesi tidak ditemukan.' };

    await this.prisma.aiChatSession.delete({ where: { id: sessionId } });
    return { message: 'Sesi chat berhasil dihapus.' };
  }
}