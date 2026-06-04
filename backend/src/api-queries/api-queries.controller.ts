import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiQueriesService } from './api-queries.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('api-queries')
@UseGuards(AuthGuard('jwt'))
export class ApiQueriesController {
  constructor(private readonly apiQueriesService: ApiQueriesService) {}

  /** POST /api-queries — Buat request builder baru */
  @Post()
  create(@Body() body: any) {
    return this.apiQueriesService.createApiQuery(body);
  }

  /** GET /api-queries — List semua API Query */
  @Get()
  findAll() {
    return this.apiQueriesService.getAllApiQueries();
  }

  /** GET /api-queries/:id — Detail + execution history */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.apiQueriesService.getApiQueryById(id);
  }

  /** PATCH /api-queries/:id — Update konfigurasi */
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.apiQueriesService.updateApiQuery(id, body);
  }

  /** POST /api-queries/:id/execute — Jalankan HTTP request */
  @Post(':id/execute')
  @HttpCode(HttpStatus.OK)
  execute(@Param('id') id: string) {
    return this.apiQueriesService.executeApiQuery(id);
  }

  /** DELETE /api-queries/:id — Hapus API Query */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.apiQueriesService.deleteApiQuery(id);
  }
}
