import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomFieldsService } from './custom-fields.service';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Custom Fields')
@ApiBearerAuth('JWT-auth')
@Controller('custom-fields')
@UseGuards(AuthGuard('jwt'))
export class CustomFieldsController {
  constructor(private readonly customFieldsService: CustomFieldsService) {}

  /** POST /custom-fields — Buat custom field baru */
  @Post()
  @ApiOperation({ summary: 'Buat calculated/custom field baru dengan ekspresi' })
  @ApiResponse({ status: 201, description: 'Custom field berhasil dibuat' })
  create(
    @Body()
    body: {
      name: string;
      dataType: string;
      expression: string;
      targetTable?: string;
    },
  ) {
    return this.customFieldsService.createCustomField(body);
  }

  /** GET /custom-fields — List semua custom field */
  @Get()
  @ApiOperation({ summary: 'List semua custom field yang tersimpan' })
  @ApiResponse({ status: 200, description: 'Daftar custom field berhasil diambil' })
  findAll() {
    return this.customFieldsService.getAllCustomFields();
  }

  /** GET /custom-fields/:id — Detail satu custom field */
  @Get(':id')
  @ApiOperation({ summary: 'Detail satu custom field beserta ekspresinya' })
  @ApiResponse({ status: 200, description: 'Detail custom field berhasil diambil' })
  @ApiResponse({ status: 404, description: 'Custom field tidak ditemukan' })
  findOne(@Param('id') id: string) {
    return this.customFieldsService.getCustomFieldById(id);
  }

  /** DELETE /custom-fields/:id — Hapus custom field */
  @Delete(':id')
  @ApiOperation({ summary: 'Hapus custom field' })
  @ApiResponse({ status: 200, description: 'Custom field berhasil dihapus' })
  remove(@Param('id') id: string) {
    return this.customFieldsService.deleteCustomField(id);
  }

  /** POST /custom-fields/:id/evaluate — Evaluasi ekspresi terhadap baris data */
  @Post(':id/evaluate')
  @ApiOperation({ summary: 'Evaluasi ekspresi custom field terhadap data yang diberikan' })
  @ApiResponse({ status: 200, description: 'Hasil evaluasi berhasil dihasilkan' })
  evaluate(
    @Param('id') id: string,
    @Body() body: { rows: Record<string, any>[] },
  ) {
    return this.customFieldsService.evaluateCustomField(id, body.rows);
  }

  /** POST /custom-fields/preview — Test ekspresi tanpa simpan ke DB */
  @Post('preview')
  @ApiOperation({ summary: 'Preview ekspresi tanpa menyimpan — untuk testing formula' })
  @ApiResponse({ status: 200, description: 'Hasil preview ekspresi' })
  preview(
    @Body() body: { expression: string; sampleData: Record<string, any> },
  ) {
    return this.customFieldsService.previewExpression(body.expression, body.sampleData);
  }

  /** POST /custom-fields/:id/attach — Hubungkan field ke tabel tertentu */
  @Post(':id/attach')
  @ApiOperation({ summary: 'Attach custom field ke tabel spesifik' })
  @ApiResponse({ status: 200, description: 'Custom field berhasil di-attach ke tabel' })
  attach(
    @Param('id') id: string,
    @Body() body: { targetTable: string },
  ) {
    return this.customFieldsService.attachToTable(id, body.targetTable);
  }
}
