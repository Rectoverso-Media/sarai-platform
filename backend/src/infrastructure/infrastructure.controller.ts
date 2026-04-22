import { Controller, Get, Post, Body, Delete, Param } from '@nestjs/common';
import { InfrastructureService } from './infrastructure.service';

@Controller('infrastructure')
export class InfrastructureController {
  constructor(private readonly infrastructureService: InfrastructureService) {}

  @Get()
  findAll() {
    return this.infrastructureService.findAll();
  }

  @Post()
  create(@Body() body: { name: string; type: string }) {
    return this.infrastructureService.create(body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.infrastructureService.remove(id);
  }
}