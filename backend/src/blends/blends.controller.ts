import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { BlendsService } from './blends.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('blends')
@UseGuards(AuthGuard('jwt'))
export class BlendsController {
  constructor(private readonly blendsService: BlendsService) {}

  /** POST /blends — Buat blend baru */
  @Post()
  create(
    @Body()
    body: {
      name: string;
      joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
      sources: {
        dataSourceId: string;
        streamName: string;
        joinKey: string;
        alias?: string;
      }[];
    },
  ) {
    return this.blendsService.createBlend(body);
  }

  /** GET /blends — List semua blend */
  @Get()
  findAll() {
    return this.blendsService.getAllBlends();
  }

  /** GET /blends/:id — Detail blend */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blendsService.getBlendById(id);
  }

  /** POST /blends/:id/execute — Jalankan blend, return data hasil JOIN */
  @Post(':id/execute')
  execute(@Param('id') id: string) {
    return this.blendsService.executeBlend(id);
  }

  /** DELETE /blends/:id — Hapus blend */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.blendsService.deleteBlend(id);
  }
}
