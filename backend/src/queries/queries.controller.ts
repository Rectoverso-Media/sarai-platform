import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { QueriesService } from './queries.service';

@Controller('queries')
export class QueriesController {
  constructor(private readonly queriesService: QueriesService) {}

  @Post()
  create(@Body() body: any) {
    return this.queriesService.createQuery(body);
  }

  @Get()
  findAll() {
    return this.queriesService.getAllQueries();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.queriesService.deleteQuery(id);
  }

  @Post(':id/execute')
  execute(@Param('id') id: string) {
    return this.queriesService.executeQuery(id);
  }

  @Post(':id/schedule')
  setSchedule(
    @Param('id') id: string, 
    @Body() body: { cronExpression: string; isActive: boolean }
  ) {
    return this.queriesService.setSchedule(id, body);
  }
}