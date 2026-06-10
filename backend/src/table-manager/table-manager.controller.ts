import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  Header,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { TableManagerService } from './table-manager.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('tables')
@UseGuards(AuthGuard('jwt'))
export class TableManagerController {
  constructor(private readonly tableManagerService: TableManagerService) {}

  /** POST /tables — Buat tabel baru */
  @Post()
  createTable(@Body() body: any) {
    return this.tableManagerService.createTable(body);
  }

  /** GET /tables — List semua tabel */
  @Get()
  findAllTables() {
    return this.tableManagerService.getAllTables();
  }

  /** GET /tables/:id — Detail tabel */
  @Get(':id')
  findOneTable(@Param('id') id: string) {
    return this.tableManagerService.getTableById(id);
  }

  /** PATCH /tables/:id — Update nama / schema / retentionDays tabel */
  @Patch(':id')
  updateTable(@Param('id') id: string, @Body() body: any) {
    return this.tableManagerService.updateTable(id, body);
  }

  /** DELETE /tables/:id — Hapus tabel */
  @Delete(':id')
  removeTable(@Param('id') id: string) {
    return this.tableManagerService.deleteTable(id);
  }

  // ── ROWS ──────────────────────────────────────────────────────────────────

  /** GET /tables/:id/rows — Ambil baris dengan paginasi */
  @Get(':id/rows')
  getRows(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tableManagerService.getRows(
      id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }

  /** POST /tables/:id/rows — Tambah satu baris */
  @Post(':id/rows')
  createRow(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.tableManagerService.createRow(id, body);
  }

  /** PATCH /tables/:id/rows/:rowId — Update satu baris */
  @Patch(':id/rows/:rowId')
  updateRow(
    @Param('id') _id: string,
    @Param('rowId') rowId: string,
    @Body() body: Record<string, any>,
  ) {
    return this.tableManagerService.updateRow(rowId, body);
  }

  /** DELETE /tables/:id/rows/:rowId — Hapus satu baris */
  @Delete(':id/rows/:rowId')
  deleteRow(@Param('id') _id: string, @Param('rowId') rowId: string) {
    return this.tableManagerService.deleteRow(rowId);
  }

  // ── BATCH ─────────────────────────────────────────────────────────────────

  /** POST /tables/:id/rows/batch-delete — Hapus multiple baris */
  @Post(':id/rows/batch-delete')
  @HttpCode(HttpStatus.OK)
  batchDelete(@Param('id') _id: string, @Body('ids') ids: string[]) {
    return this.tableManagerService.batchDeleteRows(ids);
  }

  /** POST /tables/:id/rows/batch-create — Insert multiple baris */
  @Post(':id/rows/batch-create')
  @HttpCode(HttpStatus.OK)
  batchCreate(@Param('id') id: string, @Body('rows') rows: any[]) {
    return this.tableManagerService.batchCreateRows(id, rows);
  }

  // ── IMPORT / EXPORT ───────────────────────────────────────────────────────

  /** POST /tables/:id/import — Import CSV */
  @Post(':id/import')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  importCsv(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) return { error: 'File CSV diperlukan' };
    return this.tableManagerService.importCsv(id, file.buffer);
  }

  /** GET /tables/:id/export — Download semua data sebagai CSV */
  @Get(':id/export')
  async exportCsv(@Param('id') id: string, @Res() res: Response) {
    const { csv, filename, rowCount } = await this.tableManagerService.exportCsv(id);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Row-Count', String(rowCount));
    res.send(csv);
  }
}
