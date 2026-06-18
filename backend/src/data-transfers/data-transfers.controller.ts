import {
  Controller, Get, Post, Delete, Patch, Body, Param, Res, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { DataTransfersService } from './data-transfers.service';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Data Transfers')
@ApiBearerAuth('JWT-auth')
@Controller('data-transfers')
@UseGuards(AuthGuard('jwt'))
export class DataTransfersController {
  constructor(private readonly dataTransfersService: DataTransfersService) {}

  /** GET /data-transfers — List semua transfer */
  @Get()
  @ApiOperation({ summary: 'List semua konfigurasi data transfer' })
  @ApiResponse({ status: 200, description: 'Daftar transfer berhasil diambil' })
  findAll() {
    return this.dataTransfersService.getAllTransfers();
  }

  /** GET /data-transfers/:id — Detail satu transfer */
  @Get(':id')
  @ApiOperation({ summary: 'Detail konfigurasi transfer beserta schedule' })
  @ApiResponse({ status: 200, description: 'Detail transfer berhasil diambil' })
  @ApiResponse({ status: 404, description: 'Transfer tidak ditemukan' })
  findOne(@Param('id') id: string) {
    return this.dataTransfersService.getTransferById(id);
  }

  /** GET /data-transfers/:id/history — Execution history */
  @Get(':id/history')
  @ApiOperation({ summary: 'Riwayat eksekusi transfer' })
  @ApiResponse({ status: 200, description: 'Riwayat eksekusi berhasil diambil' })
  getHistory(@Param('id') id: string) {
    return this.dataTransfersService.getTransferHistory(id);
  }

  /** POST /data-transfers — Buat konfigurasi transfer baru */
  @Post()
  @ApiOperation({ summary: 'Buat konfigurasi data transfer baru' })
  @ApiResponse({ status: 201, description: 'Transfer berhasil dibuat' })
  create(@Body() body: any) {
    return this.dataTransfersService.createTransfer(body);
  }

  /** PATCH /data-transfers/:id — Update konfigurasi transfer */
  @Patch(':id')
  @ApiOperation({ summary: 'Update konfigurasi transfer' })
  @ApiResponse({ status: 200, description: 'Transfer berhasil diupdate' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.dataTransfersService.updateTransfer(id, body);
  }

  /** POST /data-transfers/:id/run — Jalankan transfer ke Google Sheets */
  @Post(':id/run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Jalankan transfer sekarang (push data ke tujuan)' })
  @ApiResponse({ status: 200, description: 'Transfer berhasil dieksekusi' })
  runTransfer(@Param('id') id: string) {
    return this.dataTransfersService.executeTransfer(id);
  }

  /** GET /data-transfers/:id/export-excel — Download sebagai file Excel (.xlsx) */
  @Get(':id/export-excel')
  @ApiOperation({ summary: 'Download data transfer sebagai file Excel (.xlsx)' })
  @ApiResponse({ status: 200, description: 'File Excel berhasil di-generate' })
  async exportExcel(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.dataTransfersService.exportToExcel(id);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="sarai-transfer-${id}.xlsx"`,
    );
    res.send(buffer);
  }

  /** PATCH /data-transfers/:id/schedule — Set/update cron schedule */
  @Patch(':id/schedule')
  @ApiOperation({ summary: 'Set atau update jadwal cron untuk transfer otomatis' })
  @ApiResponse({ status: 200, description: 'Schedule berhasil diupdate' })
  updateSchedule(
    @Param('id') id: string,
    @Body('scheduleExpression') scheduleExpression: string,
  ) {
    return this.dataTransfersService.updateSchedule(id, scheduleExpression);
  }

  /** DELETE /data-transfers/:id — Hapus transfer */
  @Delete(':id')
  @ApiOperation({ summary: 'Hapus konfigurasi data transfer' })
  @ApiResponse({ status: 200, description: 'Transfer berhasil dihapus' })
  remove(@Param('id') id: string) {
    return this.dataTransfersService.deleteTransfer(id);
  }
}