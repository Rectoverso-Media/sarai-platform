import { Controller, Get, Post, Body } from '@nestjs/common';
import { DatasourcesService } from './datasources.service';

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
}