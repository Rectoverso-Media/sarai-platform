import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BlendsService } from './blends.service';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Blends')
@ApiBearerAuth('JWT-auth')
@Controller('blends')
@UseGuards(AuthGuard('jwt'))
export class BlendsController {
  constructor(private readonly blendsService: BlendsService) {}

  /** POST /blends — Buat blend baru */
  @Post()
  @ApiOperation({ summary: 'Buat data blend baru (join multiple sources)' })
  @ApiResponse({ status: 201, description: 'Blend berhasil dibuat' })
  @ApiResponse({ status: 400, description: 'Konfigurasi blend tidak valid' })
  create(
    @Body()
    body: {
      name: string;
      joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
      sources: {
        dataSourceId: string;
        streamName: string;
        joinKey: string;
        alias?: string;
      }[];
    },
  ) {
    return this.blendsService.createBlend(body);
  }

  /** GET /blends — List semua blend */
  @Get()
  @ApiOperation({ summary: 'List semua data blend yang tersimpan' })
  @ApiResponse({ status: 200, description: 'Daftar blend berhasil diambil' })
  findAll() {
    return this.blendsService.getAllBlends();
  }

  /** GET /blends/:id — Detail blend */
  @Get(':id')
  @ApiOperation({ summary: 'Detail konfigurasi blend beserta sources' })
  @ApiResponse({ status: 200, description: 'Detail blend berhasil diambil' })
  @ApiResponse({ status: 404, description: 'Blend tidak ditemukan' })
  findOne(@Param('id') id: string) {
    return this.blendsService.getBlendById(id);
  }

  /** POST /blends/:id/execute — Jalankan blend, return data hasil JOIN */
  @Post(':id/execute')
  @ApiOperation({ summary: 'Eksekusi blend dan return data hasil JOIN' })
  @ApiResponse({ status: 200, description: 'Blend berhasil dieksekusi, return hasil join' })
  @ApiResponse({ status: 404, description: 'Blend tidak ditemukan' })
  execute(@Param('id') id: string) {
    return this.blendsService.executeBlend(id);
  }

  /** DELETE /blends/:id — Hapus blend */
  @Delete(':id')
  @ApiOperation({ summary: 'Hapus blend' })
  @ApiResponse({ status: 200, description: 'Blend berhasil dihapus' })
  remove(@Param('id') id: string) {
    return this.blendsService.deleteBlend(id);
  }
}
