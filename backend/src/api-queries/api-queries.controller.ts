import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApiQueriesService } from './api-queries.service';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('API Queries')
@ApiBearerAuth('JWT-auth')
@Controller('api-queries')
@UseGuards(AuthGuard('jwt'))
export class ApiQueriesController {
  constructor(private readonly apiQueriesService: ApiQueriesService) {}

  /** POST /api-queries — Buat request builder baru */
  @Post()
  @ApiOperation({ summary: 'Buat konfigurasi API query baru (custom HTTP request)' })
  @ApiResponse({ status: 201, description: 'API query berhasil dibuat' })
  create(@Body() body: any) {
    return this.apiQueriesService.createApiQuery(body);
  }

  /** GET /api-queries — List semua API Query */
  @Get()
  @ApiOperation({ summary: 'List semua API query yang tersimpan' })
  @ApiResponse({ status: 200, description: 'Daftar API query berhasil diambil' })
  findAll() {
    return this.apiQueriesService.getAllApiQueries();
  }

  /** GET /api-queries/:id — Detail + execution history */
  @Get(':id')
  @ApiOperation({ summary: 'Detail API query beserta riwayat eksekusi' })
  @ApiResponse({ status: 200, description: 'Detail API query berhasil diambil' })
  @ApiResponse({ status: 404, description: 'API query tidak ditemukan' })
  findOne(@Param('id') id: string) {
    return this.apiQueriesService.getApiQueryById(id);
  }

  /** PATCH /api-queries/:id — Update konfigurasi */
  @Patch(':id')
  @ApiOperation({ summary: 'Update konfigurasi API query (URL, headers, body, auth)' })
  @ApiResponse({ status: 200, description: 'API query berhasil diupdate' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.apiQueriesService.updateApiQuery(id, body);
  }

  /** POST /api-queries/:id/execute — Jalankan HTTP request */
  @Post(':id/execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eksekusi HTTP request dan simpan hasilnya' })
  @ApiResponse({ status: 200, description: 'Request berhasil dieksekusi' })
  @ApiResponse({ status: 404, description: 'API query tidak ditemukan' })
  execute(@Param('id') id: string) {
    return this.apiQueriesService.executeApiQuery(id);
  }

  /** DELETE /api-queries/:id — Hapus API Query */
  @Delete(':id')
  @ApiOperation({ summary: 'Hapus API query' })
  @ApiResponse({ status: 200, description: 'API query berhasil dihapus' })
  remove(@Param('id') id: string) {
    return this.apiQueriesService.deleteApiQuery(id);
  }
}
