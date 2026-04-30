import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service'; 

@Processor('query-execution')
export class QueryProcessor extends WorkerHost {
  
  // 1. Masukkan Prisma ke dalam otak si Pekerja
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    console.log(`🚀 Sedang memproses query ke Database untuk job ID: ${job.id}`);
 
    const { rawSql, queryId } = job.data;

    try {
      // 2. EKSEKUSI KE POSTGRESQL
      // $queryRawUnsafe menyuruh Prisma mengeksekusi string SQL mentah persis apa adanya
      const rawResult: any[] = await this.prisma.$queryRawUnsafe(rawSql);

      console.log(`✅ Query asli selesai ditarik dari PostgreSQL: ${queryId}`);

      // 3. RAPAIKAN FORMAT HASILNYA
      // Prisma memberikan hasil seperti ini: [{ id: 1, nama: "Budi" }, { id: 2, nama: "Siti" }]
      // Tapi Frontend butuh format terpisah antara columns dan rows. ubah di sini
      
      let columns: string[] = [];
      let rows: any[] = [];

      if (rawResult && rawResult.length > 0) {
        // Ambil nama-nama kolom dari data baris pertama
        columns = Object.keys(rawResult[0]); 
        
        // Ambil isi datanya saja untuk setiap baris
        rows = rawResult.map(row => Object.values(row)); 
      }

      // 4. KEMBALIKAN HASIL KE FRONTEND
      return {
        status: 'success',
        columns: columns,
        rows: rows,
        executedAt: new Date().toISOString(),
      };

    } catch (error) {
      // cek apakah error benar-benar sebuah object Error bawaan Node.js/Prisma
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      console.error(`❌ Gagal mengeksekusi query:`, errorMessage);
      return {
        status: 'failed',
        error: `Gagal mengeksekusi SQL. Detail: ${errorMessage}`,
      };
    }
  }
}