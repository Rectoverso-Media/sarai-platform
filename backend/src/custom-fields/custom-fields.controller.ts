import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CustomFieldsService } from './custom-fields.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('custom-fields')
@UseGuards(AuthGuard('jwt'))
export class CustomFieldsController {
  constructor(private readonly customFieldsService: CustomFieldsService) {}

  /** POST /custom-fields — Buat custom field baru */
  @Post()
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
  findAll() {
    return this.customFieldsService.getAllCustomFields();
  }

  /** GET /custom-fields/:id — Detail satu custom field */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customFieldsService.getCustomFieldById(id);
  }

  /** DELETE /custom-fields/:id — Hapus custom field */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customFieldsService.deleteCustomField(id);
  }

  /** POST /custom-fields/:id/evaluate — Evaluasi ekspresi terhadap baris data */
  @Post(':id/evaluate')
  evaluate(
    @Param('id') id: string,
    @Body() body: { rows: Record<string, any>[] },
  ) {
    return this.customFieldsService.evaluateCustomField(id, body.rows);
  }

  /** POST /custom-fields/preview — Test ekspresi tanpa simpan ke DB */
  @Post('preview')
  preview(
    @Body() body: { expression: string; sampleData: Record<string, any> },
  ) {
    return this.customFieldsService.previewExpression(body.expression, body.sampleData);
  }

  /** POST /custom-fields/:id/attach — Hubungkan field ke tabel tertentu */
  @Post(':id/attach')
  attach(
    @Param('id') id: string,
    @Body() body: { targetTable: string },
  ) {
    return this.customFieldsService.attachToTable(id, body.targetTable);
  }
}
