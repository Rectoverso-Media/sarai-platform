import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DatasourcesService } from './datasources.service';

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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.datasourcesService.getDataSourceById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.datasourcesService.updateDataSource(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.datasourcesService.deleteDataSource(id);
  }
}