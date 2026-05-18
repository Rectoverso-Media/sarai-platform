import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QueriesService {
  private readonly logger = new Logger(QueriesService.name);
  constructor(
    @InjectQueue('query-execution') 
    private queryQueue: Queue,
    private prisma: PrismaService
  ) {}
  // panggil Prisma langsung di sini biar gampang
  // private prisma = new PrismaClient();

  // 1. FUNGSI SIMPAN QUERY BARU
  async createQuery(data: { name: string; description?: string; rawSql?: string; builderData?: any }) {
    try {
      const newQuery = await this.prisma.query.create({
        data: {
          name: data.name,
          description: data.description,
          rawSql: data.rawSql,
          builderData: data.builderData ? data.builderData : null,
        },
      });
      return { message: 'Query berhasil disimpan!', data: newQuery };
    } catch (error) {
      console.error('Error createQuery:', error);
      throw new HttpException('Gagal menyimpan query', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 2. FUNGSI AMBIL SEMUA DAFTAR QUERY
  async getAllQueries() {
    try {
      const queries = await this.prisma.query.findMany({
        orderBy: { createdAt: 'desc' }, // Urutkan dari yang paling baru
      });
      return { message: 'Berhasil mengambil daftar query', data: queries };
    } catch (error) {
      throw new HttpException('Gagal mengambil data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 3. FUNGSI HAPUS QUERY
  async deleteQuery(id: string) {
    try {
      await this.prisma.query.delete({
        where: { id: id },
      });
      return { message: 'Query berhasil dihapus!' };
    } catch (error) {
      throw new HttpException('Gagal menghapus query (Mungkin ID tidak ditemukan)', HttpStatus.BAD_REQUEST);
    }
  }

  // 4. FUNGSI MENJALANKAN QUERY & MENCATAT LOG (EXECUTION)
  async executeQuery(id: string) {
    try {
      // 1. Cari query-nya di database
      const query = await this.prisma.query.findUnique({
        where: { id: id },
      });

      if (!query) {
        throw new HttpException('Query tidak ditemukan', HttpStatus.NOT_FOUND);
      }

      // 2. Simulasi proses eksekusi ke Data Warehouse
      const start = Date.now();
      // Pura-puranya server lagi mikir keras nge-proses SQL selama 500 - 1500 milidetik
      await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 1000) + 500)); 
      const durationMs = Date.now() - start;

      // Simulasi jumlah baris data yang didapat (10 - 500 baris)
      const rowsReturned = Math.floor(Math.random() * 490) + 10;

      // 3. Catat ke tabel QueryExecution (CCTV)
      const executionLog = await this.prisma.queryExecution.create({
        data: {
          queryId: id,
          status: 'SUCCESS', // Dalam real-case, ini bisa 'FAILED' kalau syntax SQL-nya salah
          durationMs: durationMs,
          rowsReturned: rowsReturned,
        },
      });

      // 4. Kembalikan log eksekusi beserta sampel datanya ke Frontend
      // Masih data dummy
      return {
        message: 'Query berhasil dieksekusi!',
        executionLog: executionLog,
        previewData: [
          { id: 1, campaign_name: 'Promo Lebaran', spend: 1500000, clicks: 350 },
          { id: 2, campaign_name: 'Flash Sale 4.4', spend: 850000, clicks: 210 },
          { id: 3, campaign_name: 'Retargeting Ads', spend: 400000, clicks: 95 },
        ]
      };
    } catch (error) {
      console.error('Error executeQuery:', error);
      throw new HttpException('Gagal mengeksekusi query', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 5. FUNGSI MENYIMPAN JADWAL OTOMATIS (CRON JOB)
  async setSchedule(queryId: string, data: { cronExpression: string; isActive: boolean }) {
    try {
      // pakai "upsert": kalau jadwal belum ada, dia create, kalau udah ada, dia Update.
      const schedule = await this.prisma.querySchedule.upsert({
        where: { queryId: queryId },
        update: {
          cronExpression: data.cronExpression,
          isActive: data.isActive,
        },
        create: {
          queryId: queryId,
          cronExpression: data.cronExpression,
          isActive: data.isActive,
        },
      });

      return { 
        message: 'Jadwal otomatis berhasil disimpan! ⏰', 
        data: schedule 
      };
    } catch (error) {
      console.error('Error setSchedule:', error);
      throw new HttpException('Gagal menyimpan jadwal otomatis', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async triggerQueryExecution(queryId: string, rawSql: string) {
    // Masukkan ke antrean Upstash
    const job = await this.queryQueue.add('execute', {
      queryId,
      rawSql,
    });

    return {
      message: 'Query telah masuk antrean!',
      jobId: job.id,
    };
  }

  async getJobStatus(jobId: string) {
    const job = await this.queryQueue.getJob(jobId);
    if (!job) {
      return { state: 'not_found' };
    }
    
    const state = await job.getState(); // Bisa: 'waiting', 'active', 'completed', 'failed'
    const result = job.returnvalue; // Berisi data columns & rows yang return dari processor

    return {
      state,
      result: state === 'completed' ? result : null,
    };
  }

  async getTableColumns(tableName: string) {
    // Query rahasia PostgreSQL untuk melihat daftar kolom di sebuah tabel
    const columns: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = $1;
    `, tableName);

    // ubah formatnya biar Frontend gampang bacanya
    // Kalau tipe datanya angka, anggap 'metric' (bisa di-SUM). Sisanya 'dimension'.
    return columns.map(col => {
      const isNumber = ['integer', 'numeric', 'bigint', 'double precision', 'real'].includes(col.data_type);
      return {
        name: col.column_name,
        type: isNumber ? 'metric' : 'dimension'
      };
    });
  }

  async generateSql(prompt: string, tableName: string) {
    // 1. Kita tarik skema tabelnya dulu biar AI-nya pintar
    // Karena kamu udah bikin fungsi getTableColumns, kita manfaatkan!
    const columns = await this.getTableColumns(tableName);
    const schemaText = columns.map(c => `${c.name} (${c.type})`).join(', ');

    // 2. Tembak ke API Groq (LLaMA 3)
    const apiKey = process.env.GROQ_API_KEY;
    
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant', // Pake LLaMA 3 8B yang gratis dan kenceng
          messages: [
            {
              role: 'system',
              content: `Kamu adalah asisten Database Expert. 
              Tugasmu HANYA menghasilkan query PostgreSQL yang valid.
              Skema Tabel "${tableName}": ${schemaText}.
              ATURAN SUPER KETAT: 
              1. HANYA balas dengan kode SQL mentah.
              2. JANGAN tambahkan penjelasan apapun (tanpa markdown \`\`\`sql).
              3. JANGAN pakai titik koma di akhir jika tidak perlu.`
            },
            {
              role: 'user',
              content: `Buatkan query untuk: ${prompt}`
            }
          ],
          temperature: 0.1 // Bikin AI-nya strict & logis, nggak halu
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal menghubungi LLaMA');
      }

      // Bersihkan hasil (jaga-jaga kalau AI bandel ngasih markdown)
      let generatedSql = data.choices[0].message.content.trim();
      generatedSql = generatedSql.replace(/^```sql\n?/, '').replace(/```$/, '').trim();

      return {
        message: 'SQL berhasil di-generate',
        sql: generatedSql
      };

    } catch (error) {
      console.error('Error AI Generation:', error);
      throw new HttpException('Gagal men-generate SQL dengan AI', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  

}
