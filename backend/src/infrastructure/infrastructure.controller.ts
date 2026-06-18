import { Controller, Get, Post, Body, Delete, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InfrastructureService } from './infrastructure.service';

@ApiTags('Infrastructure')
@Controller('infrastructure')
export class InfrastructureController {
  constructor(private readonly infrastructureService: InfrastructureService) {}

  @Get()
  @ApiOperation({ summary: 'List semua komponen infrastruktur' })
  @ApiResponse({ status: 200, description: 'Daftar infrastruktur berhasil diambil' })
  findAll() {
    return this.infrastructureService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Daftarkan komponen infrastruktur baru' })
  @ApiResponse({ status: 201, description: 'Komponen berhasil didaftarkan' })
  create(@Body() body: { name: string; type: string }) {
    return this.infrastructureService.create(body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus komponen infrastruktur' })
  @ApiResponse({ status: 200, description: 'Komponen berhasil dihapus' })
  remove(@Param('id') id: string) {
    return this.infrastructureService.remove(id);
  }
}