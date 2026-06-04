import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { DataTransfersService } from './data-transfers.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('data-transfers')
@UseGuards(AuthGuard('jwt'))
export class DataTransfersController {
  constructor(private readonly dataTransfersService: DataTransfersService) {}

  /** GET /data-transfers — List semua transfer */
  @Get()
  findAll() {
    return this.dataTransfersService.getAllTransfers();
  }

  /** GET /data-transfers/:id — Detail satu transfer */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dataTransfersService.getTransferById(id);
  }

  /** GET /data-transfers/:id/history — Execution history */
  @Get(':id/history')
  getHistory(@Param('id') id: string) {
    return this.dataTransfersService.getTransferHistory(id);
  }

  /** POST /data-transfers — Buat konfigurasi transfer baru */
  @Post()
  create(@Body() body: any) {
    return this.dataTransfersService.createTransfer(body);
  }

  /** POST /data-transfers/:id/run — Jalankan transfer ke Google Sheets */
  @Post(':id/run')
  @HttpCode(HttpStatus.OK)
  runTransfer(@Param('id') id: string) {
    return this.dataTransfersService.executeTransfer(id);
  }

  /** GET /data-transfers/:id/export-excel — Download sebagai file Excel (.xlsx) */
  @Get(':id/export-excel')
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
  updateSchedule(
    @Param('id') id: string,
    @Body('scheduleExpression') scheduleExpression: string,
  ) {
    return this.dataTransfersService.updateSchedule(id, scheduleExpression);
  }

  /** DELETE /data-transfers/:id — Hapus transfer */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dataTransfersService.deleteTransfer(id);
  }
}