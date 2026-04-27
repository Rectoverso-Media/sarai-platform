import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('query-execution')
export class QueryProcessor extends WorkerHost {
  
  async process(job: Job<any, any, string>): Promise<any> {
    console.log(`🚀 Sedang memproses query untuk job ID: ${job.id}`);
    const { rawSql, queryId } = job.data;

    // 1. SIMULASI PROSES BERAT (Misal narik data jutaan baris)
    // Nanti di sini ganti pakai db.query(rawSql) beneran
    await new Promise(resolve => setTimeout(resolve, 5000)); 

    console.log(`✅ Query selesai dikerjakan: ${queryId}`);
    
    return {
      status: 'success',
      columns: ['id', 'campaign', 'clicks', 'spend'],
      rows: [
        [1, 'Promo Lebaran', 1200, 5000000],
        [2, 'Flash Sale', 850, 2500000],
        [3, 'Retargeting IG', 320, 1000000]
      ],
      executedAt: new Date().toISOString(),
    };
  }
}