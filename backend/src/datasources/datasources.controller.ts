import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DatasourcesService } from './datasources.service';

@ApiTags('Datasources')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('datasources')
export class DatasourcesController {
  constructor(private readonly datasourcesService: DatasourcesService) {}

  @Post()
  @ApiOperation({ summary: 'Daftarkan data source baru' })
  @ApiResponse({ status: 201, description: 'Data source berhasil didaftarkan' })
  create(@Body() body: any) {
    return this.datasourcesService.createDataSource(body);
  }

  @Get()
  @ApiOperation({ summary: 'List semua data source yang terdaftar' })
  @ApiResponse({ status: 200, description: 'Daftar data source berhasil diambil' })
  findAll() {
    return this.datasourcesService.getAllDataSources();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail data source beserta status koneksi' })
  @ApiResponse({ status: 200, description: 'Detail data source berhasil diambil' })
  @ApiResponse({ status: 404, description: 'Data source tidak ditemukan' })
  findOne(@Param('id') id: string) {
    return this.datasourcesService.getDataSourceById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update konfigurasi data source' })
  @ApiResponse({ status: 200, description: 'Data source berhasil diupdate' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.datasourcesService.updateDataSource(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus data source' })
  @ApiResponse({ status: 200, description: 'Data source berhasil dihapus' })
  delete(@Param('id') id: string) {
    return this.datasourcesService.deleteDataSource(id);
  }
}