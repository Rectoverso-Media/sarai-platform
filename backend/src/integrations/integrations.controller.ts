import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IntegrationsService } from './integrations.service';

@Controller('integrations')
@UseGuards(AuthGuard('jwt'))
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  // GET /integrations — List semua integrasi (opsional filter ?teamId=xxx)
  @Get()
  findAll(@Query('teamId') teamId?: string) {
    return this.integrationsService.findAll(teamId);
  }

  // GET /integrations/providers — Catalog provider yang didukung
  @Get('providers')
  getProviders() {
    return this.integrationsService.getAvailableProviders();
  }

  // GET /integrations/:id — Detail satu integrasi
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.integrationsService.findOne(id);
  }

  // POST /integrations — Tambah integrasi baru
  @Post()
  create(
    @Body() body: {
      name: string;
      provider: string;
      apiKey?: string;
      teamId?: string;
      config?: Record<string, any>;
    },
  ) {
    return this.integrationsService.create(body);
  }

  // PUT /integrations/:id — Update konfigurasi integrasi
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      apiKey?: string;
      status?: 'ACTIVE' | 'INACTIVE' | 'ERROR';
      config?: Record<string, any>;
    },
  ) {
    return this.integrationsService.update(id, body as any);
  }

  // DELETE /integrations/:id — Hapus integrasi
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.integrationsService.remove(id);
  }

  // POST /integrations/:id/test — Test koneksi
  @Post(':id/test')
  testConnection(@Param('id') id: string) {
    return this.integrationsService.testConnection(id);
  }
}
