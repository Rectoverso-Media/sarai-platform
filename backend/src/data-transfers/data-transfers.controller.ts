// 👇 INI DIA YANG KETINGGALAN TADI 😂
import { Controller, Post, Body, Param } from '@nestjs/common';
import { DataTransfersService } from './data-transfers.service';

@Controller('data-transfers')
export class DataTransfersController {
  constructor(private readonly dataTransfersService: DataTransfersService) {}

  // Simpan konfigurasi transfer baru
  @Post()
  create(@Body() body: any) {
    return this.dataTransfersService.createTransfer(body);
  }

  // Jalankan transfer berdasarkan ID yang sudah disimpan
  @Post(':id/run')
  runTransfer(@Param('id') id: string) {
    return this.dataTransfersService.executeTransfer(id);
  }
}