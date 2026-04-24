import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { DatasourcesService } from './datasources.service';

@Controller('datasources') // Pastikan ini sesuai dengan URL target kamu
export class DatasourcesController {
  constructor(private readonly datasourcesService: DatasourcesService) {}

  @Post()
  create(@Body() body: any) {
    return this.datasourcesService.createDataSource(body);
  }

  @Get()
  findAll() {
    return this.datasourcesService.getAllDataSources();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.datasourcesService.deleteDataSource(id);
  }
}