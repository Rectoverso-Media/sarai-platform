import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AirbyteService } from './airbyte.service';

@ApiTags('Airbyte')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('airbyte')
export class AirbyteController {
  constructor(private readonly airbyteService: AirbyteService) {}

  // ─── Workspace ───────────────────────────────────────────────────────────

  @Get('test-connection')
  @ApiOperation({ summary: 'Test koneksi ke Airbyte Cloud workspace' })
  @ApiResponse({ status: 200, description: 'Koneksi berhasil, return workspace info' })
  testAirbyteConnection() {
    return this.airbyteService.getWorkspaceInfo();
  }

  // ─── Connector Catalog ───────────────────────────────────────────────────

  @Get('connectors')
  @ApiOperation({ summary: 'Ambil katalog 600+ konektor yang tersedia' })
  @ApiResponse({ status: 200, description: 'Daftar konektor berhasil diambil' })
  getAvailableConnectors() {
    return this.airbyteService.getAvailableConnectors();
  }

  // ─── Sources ─────────────────────────────────────────────────────────────

  @Get('sources')
  @ApiOperation({ summary: 'List semua source yang terdaftar' })
  @ApiResponse({ status: 200, description: 'Daftar source berhasil diambil' })
  getSources() {
    return this.airbyteService.getSources();
  }

  @Post('sources')
  @ApiOperation({ summary: 'Buat source baru di Airbyte' })
  @ApiResponse({ status: 201, description: 'Source berhasil dibuat' })
  @ApiResponse({ status: 400, description: 'Konfigurasi source tidak valid' })
  createSource(@Body() body: any) {
    return this.airbyteService.createSource(body);
  }

  @Delete('sources/:id')
  @ApiOperation({ summary: 'Hapus source dari Airbyte' })
  @ApiResponse({ status: 200, description: 'Source berhasil dihapus' })
  @ApiResponse({ status: 404, description: 'Source tidak ditemukan' })
  deleteSource(@Param('id') id: string) {
    return this.airbyteService.deleteSource(id);
  }

  // ─── Sync Status ─────────────────────────────────────────────────────────

  @Get('sources/:id/sync-status')
  @ApiOperation({ summary: 'Cek status sinkronisasi source' })
  @ApiResponse({ status: 200, description: 'Status sync berhasil diambil' })
  getSyncStatus(@Param('id') id: string) {
    return this.airbyteService.getSyncStatus(id);
  }

  // ─── Connections ─────────────────────────────────────────────────────────

  @Get('connections')
  @ApiOperation({ summary: 'List semua koneksi Airbyte' })
  @ApiResponse({ status: 200, description: 'Daftar koneksi berhasil diambil' })
  getConnections() {
    return this.airbyteService.getConnections();
  }

  @Patch('connections/:id')
  @ApiOperation({ summary: 'Update konfigurasi koneksi' })
  @ApiResponse({ status: 200, description: 'Koneksi berhasil diupdate' })
  updateConnection(@Param('id') id: string, @Body() body: any) {
    return this.airbyteService.updateConnection(id, body);
  }

  @Post('connections/:id/test')
  @ApiOperation({ summary: 'Test koneksi ke source' })
  @ApiResponse({ status: 200, description: 'Hasil test koneksi' })
  testConnection(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    return this.airbyteService.testConnection(id, userId);
  }

  // ─── Sync Configuration ──────────────────────────────────────────────────

  @Get('connections/:id/config')
  @ApiOperation({ summary: 'Ambil konfigurasi sinkronisasi koneksi' })
  @ApiResponse({ status: 200, description: 'Konfigurasi sync berhasil diambil' })
  getSyncConfiguration(@Param('id') id: string) {
    return this.airbyteService.getSyncConfiguration(id);
  }

  @Patch('connections/:id/config')
  @ApiOperation({ summary: 'Update konfigurasi sinkronisasi' })
  @ApiResponse({ status: 200, description: 'Konfigurasi sync berhasil diupdate' })
  updateSyncConfiguration(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    return this.airbyteService.updateSyncConfiguration(id, body, userId);
  }
}