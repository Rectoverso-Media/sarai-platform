import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { enrichConnectors, getFallbackCatalog } from './source-catalog';

@Injectable()
export class AirbyteService {
  private readonly airbyteApiUrl = 'https://api.airbyte.com/v1';
  private readonly logger = new Logger(AirbyteService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Auth
  // ─────────────────────────────────────────────────────────────────────────

  private async getAccessToken(): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.airbyteApiUrl}/applications/token`, {
          client_id: process.env.AIRBYTE_CLIENT_ID,
          client_secret: process.env.AIRBYTE_CLIENT_SECRET,
        }),
      );
      return response.data.access_token;
    } catch (error: any) {
      this.logger.error('Gagal mengambil Access Token:', error.response?.data || error.message);
      throw new HttpException('Gagal otentikasi ke Airbyte', HttpStatus.UNAUTHORIZED);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Workspace
  // ─────────────────────────────────────────────────────────────────────────

  async getWorkspaceInfo() {
    const token = await this.getAccessToken();
    const workspaceId = process.env.AIRBYTE_WORKSPACE_ID;

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.airbyteApiUrl}/workspaces/${workspaceId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      return { message: 'Berhasil terhubung!', workspace: response.data };
    } catch (error: any) {
      throw new HttpException('Gagal mengambil data Workspace', HttpStatus.BAD_REQUEST);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Sources
  // ─────────────────────────────────────────────────────────────────────────

  async getSources() {
    const token = await this.getAccessToken();
    const workspaceId = process.env.AIRBYTE_WORKSPACE_ID;

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.airbyteApiUrl}/sources?workspaceIds=${workspaceId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );

      const realSources = response.data.data || [];
      return {
        message: 'Berhasil mengambil daftar sumber data',
        data: realSources,
      };
    } catch (error: any) {
      throw new HttpException('Gagal mengambil daftar sumber', HttpStatus.BAD_REQUEST);
    }
  }

  async createSource(data: any) {
    const token = await this.getAccessToken();
    const workspaceId = process.env.AIRBYTE_WORKSPACE_ID;

    try {
      const payload = {
        workspaceId,
        name: data.name,
        sourceDefinitionId: data.sourceDefinitionId,
        connectionConfiguration: data.connectionConfiguration,
      };

      const response = await firstValueFrom(
        this.httpService.post(`${this.airbyteApiUrl}/sources`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );

      const realSourceId = response.data.sourceId;
      const realSourceName = response.data.sourceName;

      const trialEnds = new Date();
      trialEnds.setDate(trialEnds.getDate() + 14);

      const savedSource = await this.prisma.dataSource.create({
        data: {
          name: data.name,
          sourceType: 'airbyte',
          connectorName: realSourceName,
          airbyteSourceId: realSourceId,
          status: 'Connected',
          trialEndsAt: trialEnds,
          isTrialActive: true,
        },
      });

      return {
        message: 'Koneksi berhasil dibuat di Airbyte!',
        data: savedSource,
      };
    } catch (error: any) {
      this.logger.error('Airbyte Rejection:', error.response?.data);
      throw new HttpException(
        `Validasi Gagal: ${error.response?.data?.message || 'Pastikan kredensial (JSON) yang dimasukkan sudah benar sesuai standar Airbyte.'}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async deleteSource(sourceId: string) {
    const token = await this.getAccessToken();
    try {
      await firstValueFrom(
        this.httpService.delete(`${this.airbyteApiUrl}/sources/${sourceId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );

      await this.prisma.dataSource.delete({
        where: { airbyteSourceId: sourceId },
      });

      return { message: 'Berhasil menghapus source secara permanen!' };
    } catch (error: any) {
      throw new HttpException('Gagal menghapus source', HttpStatus.BAD_REQUEST);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Connections
  // ─────────────────────────────────────────────────────────────────────────

  async getConnections() {
    const token = await this.getAccessToken();
    const workspaceId = process.env.AIRBYTE_WORKSPACE_ID;

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.airbyteApiUrl}/connections?workspaceIds=${workspaceId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      return {
        message: 'Berhasil mengambil daftar connections',
        data: response.data.data || [],
      };
    } catch (error: any) {
      this.logger.error('Gagal fetch connections:', error.response?.data || error.message);
      throw new HttpException('Gagal mengambil daftar connections', HttpStatus.BAD_REQUEST);
    }
  }

  async updateConnection(connectionId: string, data: any) {
    const token = await this.getAccessToken();

    try {
      const response = await firstValueFrom(
        this.httpService.patch(
          `${this.airbyteApiUrl}/connections/${connectionId}`,
          data,
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      );
      return {
        message: 'Connection berhasil diupdate',
        data: response.data,
      };
    } catch (error: any) {
      this.logger.error('Gagal update connection:', error.response?.data || error.message);
      throw new HttpException('Gagal mengupdate connection', HttpStatus.BAD_REQUEST);
    }
  }

  async testConnection(connectionId: string, userId?: string) {
    const token = await this.getAccessToken();

    try {
      // Trigger manual sync job sebagai "test"
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.airbyteApiUrl}/jobs`,
          { connectionId, jobType: 'sync' },
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      );

      const job = response.data;

      // Kirim notifikasi jika ada userId
      if (userId) {
        await this.notificationsService.createNotification(
          userId,
          '🔄 Sync Dipicu',
          `Manual sync untuk connection ${connectionId} berhasil dipicu. Job ID: ${job.jobId}`,
        );
      }

      return {
        message: 'Sync berhasil dipicu!',
        data: {
          jobId: job.jobId,
          status: job.status,
          connectionId,
        },
      };
    } catch (error: any) {
      this.logger.error('Gagal trigger sync:', error.response?.data || error.message);
      throw new HttpException('Gagal memicu sync manual', HttpStatus.BAD_REQUEST);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Sync Configuration
  // ─────────────────────────────────────────────────────────────────────────

  async getSyncConfiguration(connectionId: string) {
    const token = await this.getAccessToken();

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.airbyteApiUrl}/connections/${connectionId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      );

      const conn = response.data;
      return {
        message: 'Berhasil mengambil konfigurasi sync',
        data: {
          connectionId: conn.connectionId,
          name: conn.name,
          status: conn.status,
          schedule: conn.schedule ?? null,          // { scheduleType, cronExpression } atau null
          syncMode: conn.syncMode ?? 'full_refresh',
          streams: conn.configurations?.streams ?? [],
        },
      };
    } catch (error: any) {
      this.logger.error('Gagal fetch sync config:', error.response?.data || error.message);
      throw new HttpException('Gagal mengambil konfigurasi sync', HttpStatus.BAD_REQUEST);
    }
  }

  async updateSyncConfiguration(
    connectionId: string,
    config: {
      scheduleType?: 'manual' | 'cron';
      cronExpression?: string;
      streams?: Array<{ streamName: string; syncMode: string }>;
    },
    userId?: string,
  ) {
    const token = await this.getAccessToken();

    try {
      const payload: any = {};

      if (config.scheduleType) {
        payload.schedule = {
          scheduleType: config.scheduleType,
          ...(config.scheduleType === 'cron' && config.cronExpression
            ? { cronExpression: config.cronExpression }
            : {}),
        };
      }

      if (config.streams) {
        payload.configurations = { streams: config.streams };
      }

      const response = await firstValueFrom(
        this.httpService.patch(
          `${this.airbyteApiUrl}/connections/${connectionId}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      );

      if (userId) {
        await this.notificationsService.createNotification(
          userId,
          '⚙️ Konfigurasi Sync Diperbarui',
          `Jadwal sync untuk connection ${connectionId} berhasil diperbarui.`,
        );
      }

      return {
        message: 'Konfigurasi sync berhasil diperbarui',
        data: response.data,
      };
    } catch (error: any) {
      this.logger.error('Gagal update sync config:', error.response?.data || error.message);
      throw new HttpException('Gagal memperbarui konfigurasi sync', HttpStatus.BAD_REQUEST);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Sync Status
  // ─────────────────────────────────────────────────────────────────────────

  async getSyncStatus(connectionId: string) {
    const token = await this.getAccessToken();

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.airbyteApiUrl}/jobs?connectionId=${connectionId}&jobType=sync&limit=5`,
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      );

      const jobs = response.data.data || [];
      const latestJob = jobs[0];

      return {
        message: 'Berhasil mengambil status',
        data: {
          sourceId: connectionId,
          status: latestJob ? latestJob.status : 'pending',
          lastSync: latestJob ? latestJob.createdAt : null,
          nextSync: null,
          totalRowsExtracted: latestJob ? latestJob.recordsSynced ?? 0 : 0,
          recentLogs: jobs.map((job: any) => ({
            time: job.createdAt,
            status: job.status === 'succeeded' ? 'Success' : 'Warning',
            message: `Sync job ${job.status}. Records synced: ${job.recordsSynced ?? 0}`,
          })),
        },
      };
    } catch (error: any) {
      throw new HttpException('Gagal menarik status dari Airbyte', HttpStatus.BAD_REQUEST);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Connector Catalog
  // ─────────────────────────────────────────────────────────────────────────

  async getAvailableConnectors() {
    try {
      const token = await this.getAccessToken();
      const workspaceId = process.env.AIRBYTE_WORKSPACE_ID;

      const response = await firstValueFrom(
        this.httpService.get(`${this.airbyteApiUrl}/source_definitions`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { workspaceId },
        }),
      );

      const airbyteConnectors = response.data?.sourceDefinitions ?? response.data ?? [];
      // Enrich dengan metadata dari catalog lokal
      return enrichConnectors(Array.isArray(airbyteConnectors) ? airbyteConnectors : []);
    } catch (error: any) {
      this.logger.warn(
        `Airbyte source_definitions tidak tersedia (${error.response?.status}), menggunakan fallback catalog.`,
      );
      // Kembalikan catalog lokal sebagai fallback
      return getFallbackCatalog();
    }
  }
}