import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WarehouseService } from './warehouse.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('warehouse')
@UseGuards(AuthGuard('jwt'))
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  /** POST /warehouse/tables — Buat tabel warehouse baru */
  @Post('tables')
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
  findAllTables() {
    return this.warehouseService.getAllTables();
  }

  /** GET /warehouse/tables/:id — Detail tabel */
  @Get('tables/:id')
  findOneTable(@Param('id') id: string) {
    return this.warehouseService.getTableById(id);
  }

  /** GET /warehouse/tables/:id/data — Ambil data tabel (paginasi) */
  @Get('tables/:id/data')
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

  /** POST /warehouse/tables/:id/import/query — Import dari hasil query */
  @Post('tables/:id/import/query')
  @HttpCode(HttpStatus.OK)
  importFromQuery(
    @Param('id') id: string,
    @Body('queryId') queryId: string,
  ) {
    return this.warehouseService.importFromQuery(id, queryId);
  }

  /** POST /warehouse/tables/:id/import/blend — Import dari blend */
  @Post('tables/:id/import/blend')
  @HttpCode(HttpStatus.OK)
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
  removeTable(@Param('id') id: string) {
    return this.warehouseService.deleteTable(id);
  }
}
