import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { DatasourcesService } from './datasources.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('datasources')
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
  async deleteDataSource(@Param('id') id: string) {
    return this.datasourcesService.deleteDataSource(id);
  }
}