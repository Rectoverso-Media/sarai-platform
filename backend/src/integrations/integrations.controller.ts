import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { IntegrationsService } from './integrations.service';

@ApiTags('Integrations')
@ApiBearerAuth('JWT-auth')
@Controller('integrations')
@UseGuards(AuthGuard('jwt'))
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  // GET /integrations — List semua integrasi (opsional filter ?teamId=xxx)
  @Get()
  @ApiOperation({ summary: 'List semua integrasi pihak ketiga (Looker, Power BI, dll)' })
  @ApiResponse({ status: 200, description: 'Daftar integrasi berhasil diambil' })
  findAll(@Query('teamId') teamId?: string) {
    return this.integrationsService.findAll(teamId);
  }

  // GET /integrations/providers — Catalog provider yang didukung
  @Get('providers')
  @ApiOperation({ summary: 'List provider integrasi yang tersedia (Google Sheets, Excel, Looker, Power BI)' })
  @ApiResponse({ status: 200, description: 'Daftar provider berhasil diambil' })
  getProviders() {
    return this.integrationsService.getAvailableProviders();
  }

  // GET /integrations/:id — Detail satu integrasi
  @Get(':id')
  @ApiOperation({ summary: 'Detail konfigurasi integrasi' })
  @ApiResponse({ status: 200, description: 'Detail integrasi berhasil diambil' })
  @ApiResponse({ status: 404, description: 'Integrasi tidak ditemukan' })
  findOne(@Param('id') id: string) {
    return this.integrationsService.findOne(id);
  }

  // POST /integrations — Tambah integrasi baru
  @Post()
  @ApiOperation({ summary: 'Tambah integrasi baru (Google Sheets, Looker Studio, Power BI, dll)' })
  @ApiResponse({ status: 201, description: 'Integrasi berhasil ditambahkan' })
  create(
    @Body() body: {
      name: string;
      provider: string;
      apiKey?: string;
      teamId?: string;
      config?: Record<string, any>;
    },
  ) {
    return this.integrationsService.create(body);
  }

  // PUT /integrations/:id — Update konfigurasi integrasi
  @Put(':id')
  @ApiOperation({ summary: 'Update konfigurasi integrasi' })
  @ApiResponse({ status: 200, description: 'Integrasi berhasil diupdate' })
  update(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      apiKey?: string;
      status?: 'ACTIVE' | 'INACTIVE' | 'ERROR';
      config?: Record<string, any>;
    },
  ) {
    return this.integrationsService.update(id, body as any);
  }

  // DELETE /integrations/:id — Hapus integrasi
  @Delete(':id')
  @ApiOperation({ summary: 'Hapus integrasi' })
  @ApiResponse({ status: 200, description: 'Integrasi berhasil dihapus' })
  remove(@Param('id') id: string) {
    return this.integrationsService.remove(id);
  }

  // POST /integrations/:id/test — Test koneksi
  @Post(':id/test')
  @ApiOperation({ summary: 'Test koneksi ke provider integrasi' })
  @ApiResponse({ status: 200, description: 'Hasil test koneksi' })
  testConnection(@Param('id') id: string) {
    return this.integrationsService.testConnection(id);
  }
}
