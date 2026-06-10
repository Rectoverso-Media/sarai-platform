import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationStatus } from '@prisma/client';

const SUPPORTED_PROVIDERS = ['google_sheets', 'excel', 'looker_studio', 'power_bi'] as const;
type Provider = typeof SUPPORTED_PROVIDERS[number];

@Injectable()
export class IntegrationsService {
  constructor(private prisma: PrismaService) {}

  // Ambil semua integrasi — bisa di-filter per team
  async findAll(teamId?: string) {
    return this.prisma.integration.findMany({
      where: teamId ? { teamId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { linkedDocuments: true },
    });
  }

  async findOne(id: string) {
    const integration = await this.prisma.integration.findUnique({
      where: { id },
      include: { linkedDocuments: true },
    });
    if (!integration) {
      throw new NotFoundException(`Integrasi dengan id ${id} tidak ditemukan`);
    }
    return integration;
  }

  async create(data: {
    name: string;
    provider: string;
    apiKey?: string;
    teamId?: string;
    config?: Record<string, any>;
  }) {
    if (!SUPPORTED_PROVIDERS.includes(data.provider as Provider)) {
      throw new BadRequestException(
        `Provider '${data.provider}' tidak didukung. Pilih dari: ${SUPPORTED_PROVIDERS.join(', ')}`,
      );
    }

    return this.prisma.integration.create({
      data: {
        name: data.name,
        provider: data.provider,
        apiKey: data.apiKey,
        teamId: data.teamId,
        config: data.config,
        status: IntegrationStatus.ACTIVE,
      },
    });
  }

  async update(
    id: string,
    data: { name?: string; apiKey?: string; status?: IntegrationStatus; config?: Record<string, any> },
  ) {
    await this.findOne(id); // throw 404 jika tidak ada
    return this.prisma.integration.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.integration.delete({ where: { id } });
    return { message: 'Integrasi berhasil dihapus.' };
  }

  /**
   * Test apakah koneksi/config integrasi valid.
   * Setiap provider punya logika validasi sendiri.
   */
  async testConnection(id: string) {
    const integration = await this.findOne(id);

    let result: { connected: boolean; message: string; odataUrl?: string; metadataUrl?: string };

    switch (integration.provider) {
      case 'google_sheets':
        result = await this.testGoogleSheetsConnection();
        break;
      case 'excel':
        result = { connected: true, message: 'Excel export siap (local generation).' };
        break;
      case 'looker_studio':
      case 'power_bi':
        result = this.testODataEndpoint();
        break;
      default:
        result = { connected: false, message: 'Provider tidak dikenal.' };
    }

    // Update status integrasi berdasarkan hasil test
    await this.prisma.integration.update({
      where: { id },
      data: {
        status: result.connected
          ? IntegrationStatus.ACTIVE
          : IntegrationStatus.ERROR,
      },
    });

    return result;
  }

  private async testGoogleSheetsConnection() {
    const hasCredentials =
      !!process.env.GOOGLE_CLIENT_EMAIL && !!process.env.GOOGLE_PRIVATE_KEY;
    return {
      connected: hasCredentials,
      message: hasCredentials
        ? '✅ Google credentials tersedia dan siap digunakan.'
        : '❌ GOOGLE_CLIENT_EMAIL atau GOOGLE_PRIVATE_KEY belum dikonfigurasi.',
    };
  }

  private testODataEndpoint() {
    return {
      connected: true,
      message: '✅ OData endpoint aktif. Gunakan URL: /odata/SyncedData',
      odataUrl: `${process.env.BACKEND_URL || 'http://localhost:3001'}/odata/SyncedData`,
      metadataUrl: `${process.env.BACKEND_URL || 'http://localhost:3001'}/odata/$metadata`,
    };
  }

  getAvailableProviders() {
    return [
      {
        id: 'google_sheets',
        name: 'Google Sheets',
        description: 'Export data langsung ke Google Spreadsheet',
        icon: '📊',
        requiresCredentials: true,
        credentialFields: ['GOOGLE_CLIENT_EMAIL', 'GOOGLE_PRIVATE_KEY'],
      },
      {
        id: 'excel',
        name: 'Microsoft Excel',
        description: 'Download file .xlsx dengan formatting profesional',
        icon: '📗',
        requiresCredentials: false,
      },
      {
        id: 'looker_studio',
        name: 'Looker Studio',
        description: 'Hubungkan via OData endpoint ke Looker Studio Community Connector',
        icon: '📈',
        requiresCredentials: false,
        odataEndpoint: true,
      },
      {
        id: 'power_bi',
        name: 'Power BI',
        description: 'Hubungkan native ke Power BI via OData endpoint',
        icon: '⚡',
        requiresCredentials: false,
        odataEndpoint: true,
      },
    ];
  }
}
