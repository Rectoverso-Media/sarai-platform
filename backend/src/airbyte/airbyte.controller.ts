import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { AirbyteService } from './airbyte.service';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';

@Controller('airbyte')
export class AirbyteController {
  constructor(private readonly airbyteService: AirbyteService) {}

  @Get('connectors')
  async getAvailableConnectors() {
    return this.airbyteService.getAvailableConnectors();
  }

  @Get('test-connection')
  testConnection() {
    return this.airbyteService.getWorkspaceInfo();
  }

  @Get('sources')
  getSources() {
    return this.airbyteService.getSources();
  }

  // JALUR UNTUK TAMBAH DATA (Dari Halaman Add Data Source)
  @Post('sources')
  createSource(@Body() body: any) {
    return this.airbyteService.createSource(body);
  }

  // JALUR UNTUK HAPUS DATA (Dari Halaman Katalog)
  @Delete('sources/:id')
  deleteSource(@Param('id') id: string) {
    return this.airbyteService.deleteSource(id);
  }

  // JALUR UNTUK CEK STATUS SYNC (Dari Halaman Detail Data Source)
  @Get('sources/:id/sync-status')
  getSyncStatus(@Param('id') id: string) {
    return this.airbyteService.getSyncStatus(id);
  }
}