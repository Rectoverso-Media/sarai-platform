import {
  Controller, Get, Post, Delete, Body, Param, Query, UseGuards,
  UseInterceptors, UploadedFile, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { WarehouseService } from './warehouse.service';
import { AuthGuard } from '@nestjs/passport';

/**
 * WarehouseController — route /warehouse/tables
 * Shares ManagedTable model with /tables (TableManagerController).
 * Focuses on warehousing concerns: retentionDays, import from query/blend/CSV.
 */
@ApiTags('Warehouse')
@ApiBearerAuth('JWT-auth')
@Controller('warehouse')
@UseGuards(AuthGuard('jwt'))
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  /** POST /warehouse/tables — Buat tabel warehouse baru */
  @Post('tables')
  @ApiOperation({ summary: 'Buat tabel warehouse baru dengan schema dan retention policy' })
  @ApiResponse({ status: 201, description: 'Tabel warehouse berhasil dibuat' })
  createTable(
    @Body()
    body: {
      tableName: string;
      schema: { name: string; type: string }[];
      retentionDays?: number;
    },
  ) {
    return this.warehouseService.createTable(body);
  }

  /** GET /warehouse/tables — List semua tabel */
  @Get('tables')
  @ApiOperation({ summary: 'List semua tabel warehouse' })
  @ApiResponse({ status: 200, description: 'Daftar tabel warehouse berhasil diambil' })
  findAllTables() {
    return this.warehouseService.getAllTables();
  }

  /** GET /warehouse/tables/:id — Detail tabel */
  @Get('tables/:id')
  @ApiOperation({ summary: 'Detail tabel warehouse beserta schema dan retention' })
  @ApiResponse({ status: 200, description: 'Detail tabel berhasil diambil' })
  @ApiResponse({ status: 404, description: 'Tabel tidak ditemukan' })
  findOneTable(@Param('id') id: string) {
    return this.warehouseService.getTableById(id);
  }

  /** GET /warehouse/tables/:id/data — Ambil data tabel (paginasi) */
  @Get('tables/:id/data')
  @ApiOperation({ summary: 'Ambil data tabel warehouse dengan paginasi' })
  @ApiResponse({ status: 200, description: 'Data tabel berhasil diambil' })
  getTableData(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.warehouseService.getTableData(
      id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }

  /** POST /warehouse/tables/:id/import/query — Import dari snapshot hasil query */
  @Post('tables/:id/import/query')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Import data dari hasil eksekusi query ke tabel warehouse' })
  @ApiResponse({ status: 200, description: 'Data berhasil diimport dari query' })
  importFromQuery(
    @Param('id') id: string,
    @Body('queryId') queryId: string,
  ) {
    return this.warehouseService.importFromQuery(id, queryId);
  }

  /** POST /warehouse/tables/:id/import/blend — Import dari blend */
  @Post('tables/:id/import/blend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Import data dari hasil blend ke tabel warehouse' })
  @ApiResponse({ status: 200, description: 'Data berhasil diimport dari blend' })
  importFromBlend(
    @Param('id') id: string,
    @Body('blendId') blendId: string,
  ) {
    return this.warehouseService.importFromBlend(id, blendId);
  }

  /** POST /warehouse/tables/:id/import/csv — Import dari file CSV (multipart) */
  @Post('tables/:id/import/csv')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Import data dari file CSV ke tabel warehouse' })
  @ApiResponse({ status: 200, description: 'Data CSV berhasil diimport' })
  importFromCsv(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      return { error: 'File CSV diperlukan' };
    }
    return this.warehouseService.importFromCsv(id, file.buffer);
  }

  /** DELETE /warehouse/tables/:id — Hapus tabel dan semua datanya */
  @Delete('tables/:id')
  @ApiOperation({ summary: 'Hapus tabel warehouse beserta semua data' })
  @ApiResponse({ status: 200, description: 'Tabel berhasil dihapus' })
  removeTable(@Param('id') id: string) {
    return this.warehouseService.deleteTable(id);
  }
}
