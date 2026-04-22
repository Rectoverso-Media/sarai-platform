import { Controller, Get, Post, Body, Delete, Param } from '@nestjs/common';
import { DatasourcesService } from './datasources.service';
// import { Controller, Get, Post, Body, Delete, Param } from '@nestjs/common';




@Controller('datasources')
export class DatasourcesController {
  constructor(private readonly datasourcesService: DatasourcesService) {}

  @Get()
  findAll() {
    return this.datasourcesService.findAll();
  }

  @Post()
  create(@Body() body: any) {
    return this.datasourcesService.create(body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.datasourcesService.remove(id);
  }
}