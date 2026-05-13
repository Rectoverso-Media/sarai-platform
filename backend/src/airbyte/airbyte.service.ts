import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service'; 

@Injectable()
export class AirbyteService {
  private readonly airbyteApiUrl = 'https://api.airbyte.com/v1';

  constructor(private readonly httpService: HttpService,
              private readonly prisma: PrismaService
  ) {}

  private async getAccessToken(): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.airbyteApiUrl}/applications/token`, {
          client_id: process.env.AIRBYTE_CLIENT_ID,
          client_secret: process.env.AIRBYTE_CLIENT_SECRET,
        })
      );
      return response.data.access_token;
    } catch (error: any) {
      console.error('Gagal mengambil Access Token:', error.response?.data || error.message);
      throw new HttpException('Gagal otentikasi', HttpStatus.UNAUTHORIZED);
    }
  }

  async getWorkspaceInfo() {
    const token = await this.getAccessToken();
    const workspaceId = process.env.AIRBYTE_WORKSPACE_ID;

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.airbyteApiUrl}/workspaces/${workspaceId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      return { message: 'Berhasil terhubung!', workspace: response.data };
    } catch (error: any) {
      throw new HttpException('Gagal mengambil data Workspace', HttpStatus.BAD_REQUEST);
    }
  }

  async getSources() {
    const token = await this.getAccessToken();
    const workspaceId = process.env.AIRBYTE_WORKSPACE_ID;

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.airbyteApiUrl}/sources?workspaceIds=${workspaceId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      
      // GABUNGKAN DATA ASLI AIRBYTE DENGAN DATA SIMULASI KITA
      const realSources = response.data.data || [];
      const combinedSources = [...realSources]; 

      return {
        message: 'Berhasil mengambil daftar sumber data',
        data: combinedSources,
      };
    } catch (error: any) {
      throw new HttpException('Gagal mengambil daftar', HttpStatus.BAD_REQUEST);
    }
  }

  async createSource(data: any) {
    const token = await this.getAccessToken();
    const workspaceId = process.env.AIRBYTE_WORKSPACE_ID;
    
    try {
      const payload = {
        workspaceId: workspaceId,
        name: data.name,
        sourceDefinitionId: data.sourceDefinitionId, 
        connectionConfiguration: data.connectionConfiguration 
      };

      // 1. Tembak ke API Airbyte Cloud
      const response = await firstValueFrom(
        this.httpService.post(`${this.airbyteApiUrl}/sources`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      
      const realSourceId = response.data.sourceId; 
      const realSourceName = response.data.sourceName;

      // 2. SIMPAN KE DATABASE LOKAL HANYA JIKA AIRBYTE SUKSES
      const trialEnds = new Date();
      trialEnds.setDate(trialEnds.getDate() + 14);

      const savedSource = await this.prisma.dataSource.create({
        data: {
          name: data.name,
          sourceType: 'airbyte',
          connectorName: realSourceName, 
          airbyteSourceId: realSourceId, // Ini sekarang pakai ID Asli dari Airbyte
          status: 'Connected',
          trialEndsAt: trialEnds,
        }
      });

      return { 
        message: 'Koneksi berhasil dibuat di Airbyte!', 
        data: savedSource 
      };

    } catch (error: any) {
      // 3. JIKA AIRBYTE MENOLAK, LEMPAR ERROR KE FRONTEND
      console.error('Airbyte Rejection Detail:', error.response?.data);
      throw new HttpException(
        `Validasi Gagal: ${error.response?.data?.message || 'Pastikan kredensial (JSON) yang dimasukkan sudah benar sesuai standar Airbyte.'}`, 
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async deleteSource(sourceId: string) {
    const token = await this.getAccessToken();
    try {
      // 1. Hapus dari Airbyte
      await firstValueFrom(
        this.httpService.delete(`${this.airbyteApiUrl}/sources/${sourceId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      // 2. Hapus dari Database Prisma
      await this.prisma.dataSource.delete({
        where: { airbyteSourceId: sourceId }
      });

      return { message: 'Berhasil menghapus source secara permanen!' };
    } catch (error: any) {
      throw new HttpException('Gagal menghapus source', HttpStatus.BAD_REQUEST);
    }
  }
  // 6. FUNGSI CEK STATUS SINKRONISASI (GET /airbyte/sources/:id/sync-status)
  async getSyncStatus(connectionId: string) {
    const token = await this.getAccessToken();
    
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.airbyteApiUrl}/jobs?connectionId=${connectionId}&jobType=sync&limit=3`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      const jobs = response.data.data;
      const latestJob = jobs[0]; // Ambil job paling terakhir

      // Mapping data asli dari Airbyte ke format Frontend kamu
      return {
        message: 'Berhasil mengambil status',
        data: {
          sourceId: connectionId,
          status: latestJob ? latestJob.status : 'Pending',
          lastSync: latestJob ? latestJob.createdAt : null,
          nextSync: null, // Airbyte API butuh endpoint terpisah untuk schedule
          totalRowsExtracted: latestJob ? latestJob.recordsSynced : 0,
          recentLogs: jobs.map((job: any) => ({
            time: job.createdAt,
            status: job.status === 'succeeded' ? 'Success' : 'Warning',
            message: `Sync job ${job.status}. Records synced: ${job.recordsSynced}`
          }))
        }
      };
    } catch (error: any) {
      throw new HttpException('Gagal menarik status real dari Airbyte', HttpStatus.BAD_REQUEST);
    }
  }

  async getAvailableConnectors() {
    try {
      const token = await this.getAccessToken();
      const workspaceId = process.env.AIRBYTE_WORKSPACE_ID;

      const response = await firstValueFrom(
        this.httpService.get(
          `${this.airbyteApiUrl}/source_definitions`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              workspaceId: workspaceId,
            },
          }
        )
      );

      return response.data;

    } catch (error: any) {
      console.log(
        "STATUS:",
        error.response?.status
      );

      console.log(
        "DETAIL:",
        JSON.stringify(error.response?.data, null, 2)
      );

      throw error;
    }
  }
}