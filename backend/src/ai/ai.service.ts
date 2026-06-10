import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(private prisma: PrismaService) {
    this.openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }

  // ================================================================
  // CORE STREAMING — Async generator untuk WebSocket
  // ================================================================

  /**
   * Stream respons AI sebagai async generator.
   * Dipanggil oleh AiGateway untuk WebSocket streaming.
   */
  async *streamChatToSocket(userMessage: string): AsyncGenerator<string> {
    try {
      const systemPrompt = await this.buildSystemPrompt(userMessage);

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
          yield text;
        }
      }
    } catch (error) {
      console.error('AI Stream Error:', error);
      throw new InternalServerErrorException('Gagal memproses AI response');
    }
  }

  // ================================================================
  // CONTEXT BUILDER — Injeksi data dari synced_data
  // ================================================================

  /**
   * Bangun system prompt yang kaya konteks.
   * Ambil data relevan dari synced_data berdasarkan keywords pesan user.
   */
  private async buildSystemPrompt(userMessage: string): Promise<string> {
    // 1. Metadata statistik dasar
    const totalSources = await this.prisma.dataSource.count();
    const connectedSources = await this.prisma.dataSource.count({
      where: { status: 'Connected' },
    });
    const totalQueries = await this.prisma.query.count();
    const totalUsers = await this.prisma.user.count();

    // 2. Injeksi data dari synced_data jika ada dan relevan
    const syncedDataContext = await this.fetchRelevantSyncedData(userMessage);

    // 3. List stream yang tersedia di synced_data
    const availableStreams = await this.getAvailableStreams();

    const basePrompt = `Kamu adalah SARAI, asisten AI pintar untuk platform analitik data terintegrasi.

METRIK SISTEM SAAT INI:
- Total pengguna: ${totalUsers}
- Total Data Source: ${totalSources} (${connectedSources} aktif/Connected)
- Total Query tersimpan: ${totalQueries}

DATA YANG TERSEDIA (synced streams): ${availableStreams.length > 0 ? availableStreams.join(', ') : 'Belum ada data yang di-sync'}
`;

    const dataContextSection =
      syncedDataContext.length > 0
        ? `\nDATA KONTEKSTUAL (sampel dari synced_data yang relevan dengan pertanyaan):\n${syncedDataContext}\n`
        : '';

    const instructions = `
INSTRUKSI:
1. Jawab pertanyaan pengguna menggunakan data di atas jika relevan.
2. Jika pengguna bertanya tentang data spesifik (penjualan, order, campaign, dll), gunakan data kontekstual di atas.
3. Jika data tidak tersedia, beritahu user stream mana yang perlu di-sync terlebih dahulu.
4. Jika pertanyaan di luar data, jawab berdasarkan pengetahuan umum tentang data engineering dan analytics.
5. Selalu gunakan bahasa Indonesia yang profesional, ringkas, dan mudah dipahati.
6. Format angka dengan pemisah ribuan (contoh: 1.250.000) dan gunakan satuan yang sesuai.`;

    return basePrompt + dataContextSection + instructions;
  }

  /**
   * Ambil sample data dari synced_data yang relevan dengan pertanyaan user.
   * Melakukan simple keyword matching terhadap stream names yang tersedia.
   */
  private async fetchRelevantSyncedData(userMessage: string): Promise<string> {
    try {
      const msg = userMessage.toLowerCase();

      // Ambil semua stream yang ada
      const streams = await this.getAvailableStreams();
      if (streams.length === 0) return '';

      // Cari stream yang relevan berdasarkan keyword dalam pesan
      const relevantStreams = streams.filter((stream) => {
        const streamLower = stream.toLowerCase();
        // Cek apakah nama stream atau kata kunci bisnis umum cocok
        return (
          msg.includes(streamLower) ||
          (msg.includes('penjualan') && streamLower.includes('sale')) ||
          (msg.includes('order') && streamLower.includes('order')) ||
          (msg.includes('produk') && streamLower.includes('product')) ||
          (msg.includes('campaign') && streamLower.includes('campaign')) ||
          (msg.includes('iklan') && streamLower.includes('ad')) ||
          (msg.includes('pelanggan') && streamLower.includes('customer'))
        );
      });

      // Fallback: ambil stream pertama jika tidak ada yang cocok dan ada > 1 stream
      const targetStreams =
        relevantStreams.length > 0
          ? relevantStreams.slice(0, 2)
          : streams.slice(0, 1);

      const contextParts: string[] = [];

      for (const streamName of targetStreams) {
        // Ambil max 10 rows sample dari stream ini
        const rows = await this.prisma.$queryRaw<
          { recordData: any; syncedAt: Date }[]
        >`
          SELECT "recordData", "syncedAt"
          FROM synced_data
          WHERE "streamName" = ${streamName}
          ORDER BY "syncedAt" DESC
          LIMIT 10
        `;

        if (rows.length > 0) {
          const sample = rows
            .map((r) => JSON.stringify(r.recordData))
            .join('\n');
          contextParts.push(
            `Stream "${streamName}" (${rows.length} baris terbaru):\n${sample}`,
          );
        }
      }

      return contextParts.join('\n\n');
    } catch (error) {
      console.warn('Could not fetch synced data context:', error);
      return '';
    }
  }

  /**
   * Ambil list stream names yang tersedia di synced_data.
   */
  private async getAvailableStreams(): Promise<string[]> {
    try {
      const result = await this.prisma.$queryRaw<{ streamName: string }[]>`
        SELECT DISTINCT "streamName" FROM synced_data ORDER BY "streamName"
      `;
      return result.map((r) => r.streamName);
    } catch {
      return [];
    }
  }

  // ================================================================
  // CHAT HISTORY — Simpan & Ambil Percakapan
  // ================================================================

  async createChatSession(userId: string, title?: string) {
    return this.prisma.aiChatSession.create({
      data: {
        userId,
        title: title || `Sesi ${new Date().toLocaleDateString('id-ID')}`,
      },
    });
  }

  async saveMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
  ) {
    return this.prisma.aiChatMessage.create({
      data: { sessionId, role, content },
    });
  }

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

  async getChatMessages(sessionId: string, userId: string) {
    const session = await this.prisma.aiChatSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) return null;

    return this.prisma.aiChatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async deleteChatSession(sessionId: string, userId: string) {
    const session = await this.prisma.aiChatSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) return { message: 'Sesi tidak ditemukan.' };

    await this.prisma.aiChatSession.delete({ where: { id: sessionId } });
    return { message: 'Sesi chat berhasil dihapus.' };
  }

  async updateSessionTitle(
    sessionId: string,
    userId: string,
    title: string,
  ) {
    const session = await this.prisma.aiChatSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) return null;
    return this.prisma.aiChatSession.update({
      where: { id: sessionId },
      data: { title },
    });
  }
}