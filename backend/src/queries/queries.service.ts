import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import Redis from 'ioredis';

const QUERY_CACHE_TTL = 300; // 5 menit dalam detik

@Injectable()
export class QueriesService {
  private readonly logger = new Logger(QueriesService.name);
  private readonly redis: Redis;

  constructor(
    @InjectQueue('query-execution')
    private queryQueue: Queue,
    private prisma: PrismaService,
  ) {
    // Koneksi langsung ke Upstash Redis untuk caching hasil query
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      username: 'default',
      password: process.env.REDIS_PASSWORD,
      tls: {}, // Wajib untuk Upstash SSL
    });
  }

  // ── HELPER ──────────────────────────────────────────────────────────────

  private getCacheKey(queryId: string): string {
    return `query-result:${queryId}`;
  }

  // ── CRUD QUERY ───────────────────────────────────────────────────────────

  // 1. SIMPAN QUERY BARU
  async createQuery(data: {
    name: string;
    description?: string;
    rawSql?: string;
    builderData?: any;
    teamId?: string;
    createdById?: string;
    connectionId?: string;
    streamName?: string;
  }) {
    try {
      const newQuery = await this.prisma.query.create({
        data: {
          name: data.name,
          description: data.description,
          rawSql: data.rawSql,
          builderData: data.builderData ?? null,
          teamId: data.teamId,
          createdById: data.createdById,
          connectionId: data.connectionId,
          streamName: data.streamName,
        },
      });
      return { message: 'Query berhasil disimpan!', data: newQuery };
    } catch (error) {
      this.logger.error('Error createQuery:', error);
      throw new HttpException('Gagal menyimpan query', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 2. AMBIL SEMUA QUERY (per team jika teamId diberikan)
  async getAllQueries(teamId?: string) {
    try {
      const queries = await this.prisma.query.findMany({
        where: teamId ? { teamId } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          schedules: true,
          executions: {
            orderBy: { executedAt: 'desc' },
            take: 1, // Hanya ambil eksekusi terakhir untuk preview status
          },
        },
      });
      return { message: 'Berhasil mengambil daftar query', data: queries };
    } catch (error) {
      throw new HttpException('Gagal mengambil data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 3. DETAIL SATU QUERY
  async getQueryById(id: string) {
    const query = await this.prisma.query.findUnique({
      where: { id },
      include: {
        schedules: true,
        executions: {
          orderBy: { executedAt: 'desc' },
          take: 5,
        },
      },
    });
    if (!query) throw new HttpException('Query tidak ditemukan', HttpStatus.NOT_FOUND);
    return { data: query };
  }

  // 4. HAPUS QUERY
  async deleteQuery(id: string) {
    try {
      await this.redis.del(this.getCacheKey(id)); // bersihkan cache juga
      await this.prisma.query.delete({ where: { id } });
      return { message: 'Query berhasil dihapus!' };
    } catch (error) {
      throw new HttpException(
        'Gagal menghapus query (Mungkin ID tidak ditemukan)',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ── EXECUTION ────────────────────────────────────────────────────────────

  // 5. EXECUTE QUERY (kirim ke BullMQ queue)
  async executeQuery(id: string) {
    const query = await this.prisma.query.findUnique({ where: { id } });
    if (!query) throw new HttpException('Query tidak ditemukan', HttpStatus.NOT_FOUND);
    if (!query.rawSql) throw new HttpException('Query ini tidak punya SQL untuk dieksekusi', HttpStatus.BAD_REQUEST);

    // Invalidate cache lama agar eksekusi baru punya hasil fresh
    await this.redis.del(this.getCacheKey(id));

    // Buat record QueryExecution dulu dengan status PENDING
    const executionLog = await this.prisma.queryExecution.create({
      data: {
        queryId: id,
        status: 'PENDING',
      },
    });

    // Kirim ke BullMQ queue
    const job = await this.queryQueue.add('execute', {
      queryId: id,
      executionId: executionLog.id,
      rawSql: query.rawSql,
      teamId: query.teamId,
      createdById: query.createdById,
    });

    return {
      message: 'Query masuk ke antrean eksekusi!',
      executionId: executionLog.id,
      jobId: job.id,
    };
  }

  // 6. AMBIL HASIL QUERY (dari cache Redis, atau eksekusi terakhir di DB)
  async getQueryResult(id: string) {
    // Cek cache dulu
    const cached = await this.redis.get(this.getCacheKey(id));
    if (cached) {
      this.logger.debug(`Cache HIT untuk query ${id}`);
      return { fromCache: true, data: JSON.parse(cached) };
    }

    // Kalau tidak ada cache, ambil dari hasil BullMQ job terakhir
    const lastExecution = await this.prisma.queryExecution.findFirst({
      where: { queryId: id, status: 'SUCCESS' },
      orderBy: { executedAt: 'desc' },
    });

    if (!lastExecution) {
      return { fromCache: false, data: null, message: 'Belum ada hasil eksekusi sukses' };
    }

    return { fromCache: false, data: null, message: 'Jalankan query lagi untuk melihat hasil terbaru' };
  }

  // 7. SIMPAN HASIL KE CACHE (dipanggil dari processor setelah sukses)
  async cacheQueryResult(queryId: string, result: any) {
    await this.redis.set(
      this.getCacheKey(queryId),
      JSON.stringify(result),
      'EX',
      QUERY_CACHE_TTL,
    );
  }

  // 8. HISTORY EKSEKUSI
  async getQueryHistory(id: string) {
    const history = await this.prisma.queryExecution.findMany({
      where: { queryId: id },
      orderBy: { executedAt: 'desc' },
      take: 20,
    });
    return { data: history };
  }

  // ── SCHEDULE ─────────────────────────────────────────────────────────────

  // 9. SET / UPDATE SCHEDULE
  async setSchedule(queryId: string, data: { cronExpression: string; isActive: boolean }) {
    try {
      const schedule = await this.prisma.querySchedule.upsert({
        where: { queryId },
        update: {
          cronExpression: data.cronExpression,
          isActive: data.isActive,
        },
        create: {
          queryId,
          cronExpression: data.cronExpression,
          isActive: data.isActive,
        },
      });
      return { message: 'Jadwal otomatis berhasil disimpan! ⏰', data: schedule };
    } catch (error) {
      this.logger.error('Error setSchedule:', error);
      throw new HttpException('Gagal menyimpan jadwal otomatis', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 10. AMBIL SEMUA SCHEDULE AKTIF (dipakai oleh scheduler)
  async getActiveSchedules() {
    return this.prisma.querySchedule.findMany({
      where: { isActive: true },
      include: { query: true },
    });
  }

  // 11. UPDATE lastRunAt & nextRunAt setelah schedule dijalankan
  async updateScheduleRunTime(scheduleId: string) {
    const now = new Date();
    await this.prisma.querySchedule.update({
      where: { id: scheduleId },
      data: { lastRunAt: now },
    });
  }

  // ── QUEUE HELPERS ────────────────────────────────────────────────────────

  async triggerQueryExecution(queryId: string, rawSql: string) {
    const job = await this.queryQueue.add('execute', { queryId, rawSql });
    return { message: 'Query telah masuk antrean!', jobId: job.id };
  }

  async getJobStatus(jobId: string) {
    const job = await this.queryQueue.getJob(jobId);
    if (!job) return { state: 'not_found' };
    const state = await job.getState();
    const result = job.returnvalue;
    return {
      state,
      result: state === 'completed' ? result : null,
    };
  }

  // ── SCHEMA & AI ──────────────────────────────────────────────────────────

  // 12. LIST SEMUA STREAM DI synced_data (untuk dropdown di frontend)
  async getSyncedTables() {
    const streams: any[] = await this.prisma.$queryRaw`
      SELECT DISTINCT "streamName", COUNT(*) as record_count
      FROM synced_data
      GROUP BY "streamName"
      ORDER BY "streamName"
    `;
    return {
      data: streams.map((s) => ({
        streamName: s.streamName,
        recordCount: Number(s.record_count),
      })),
    };
  }

  // 13. LIST KOLOM DARI STREAM TERTENTU DI synced_data
  async getTableColumns(tableName: string) {
    // Ambil 1 sampel baris dari synced_data untuk stream ini
    const sample: any = await this.prisma.$queryRaw`
      SELECT "recordData" FROM synced_data
      WHERE "streamName" = ${tableName}
      LIMIT 1
    `;
    if (!sample || sample.length === 0) {
      return [];
    }
    const sampleRecord = sample[0].recordData as Record<string, any>;
    return Object.entries(sampleRecord).map(([key, value]) => ({
      name: key,
      type: typeof value === 'number' ? 'metric' : 'dimension',
    }));
  }

  // 14. GENERATE SQL DENGAN AI (Groq)
  async generateSql(prompt: string, tableName: string) {
    const columns = await this.getTableColumns(tableName);
    const schemaText = columns.length
      ? columns.map((c) => `${c.name} (${c.type})`).join(', ')
      : 'tidak ada kolom yang ditemukan';

    const apiKey = process.env.GROQ_API_KEY;
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `Kamu adalah asisten Database Expert.
              Tugasmu HANYA menghasilkan query PostgreSQL yang valid.
              Tabel target adalah "synced_data" dengan filter WHERE "streamName" = '${tableName}'.
              Kolom yang tersedia di dalam field "recordData" (JSON): ${schemaText}.
              ATURAN KETAT:
              1. HANYA balas dengan kode SQL mentah.
              2. JANGAN tambahkan penjelasan (tanpa markdown \`\`\`sql).
              3. Gunakan operator ->> untuk akses JSON field, contoh: "recordData"->>'nama_kolom'
              4. Selalu sertakan WHERE "streamName" = '${tableName}'`,
            },
            {
              role: 'user',
              content: `Buatkan query untuk: ${prompt}`,
            },
          ],
          temperature: 0.1,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Gagal menghubungi AI');

      let generatedSql = data.choices[0].message.content.trim();
      generatedSql = generatedSql.replace(/^```sql\n?/, '').replace(/```$/, '').trim();
      return { message: 'SQL berhasil di-generate', sql: generatedSql };
    } catch (error) {
      this.logger.error('Error AI Generation:', error);
      throw new HttpException('Gagal men-generate SQL dengan AI', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
