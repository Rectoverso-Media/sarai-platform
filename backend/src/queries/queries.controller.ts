import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { QueriesService } from './queries.service';
import { GoogleSheetsService } from '../integrations/google-sheets/google-sheets.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('queries')
@UseGuards(AuthGuard('jwt'))
export class QueriesController {
  constructor(
    private readonly queriesService: QueriesService,
    private readonly googleSheetsService: GoogleSheetsService,
  ) {}

  // ── CRUD ────────────────────────────────────────────────────────────────

  /** POST /queries — Buat query baru */
  @Post()
  create(@Body() body: any, @Request() req: any) {
    return this.queriesService.createQuery({
      ...body,
      createdById: req.user?.id,
      teamId: body.teamId ?? req.user?.teamId,
    });
  }

  /** GET /queries — List semua query (filter per team) */
  @Get()
  findAll(@Request() req: any, @Query('teamId') teamId?: string) {
    // Gunakan teamId dari query param, fallback ke teamId user dari JWT
    return this.queriesService.getAllQueries(teamId ?? req.user?.teamId);
  }

  /** GET /queries/synced-tables — List stream yang tersedia di synced_data */
  @Get('synced-tables')
  getSyncedTables() {
    return this.queriesService.getSyncedTables();
  }

  /** GET /queries/schema/:streamName — Kolom dari stream tertentu */
  @Get('schema/:tableName')
  async getTableSchema(@Param('tableName') tableName: string) {
    return this.queriesService.getTableColumns(tableName);
  }

  /** GET /queries/:id — Detail satu query */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.queriesService.getQueryById(id);
  }

  /** DELETE /queries/:id — Hapus query */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.queriesService.deleteQuery(id);
  }

  // ── EXECUTION ────────────────────────────────────────────────────────────

  /** POST /queries/:id/execute — Jalankan query (async via BullMQ) */
  @Post(':id/execute')
  execute(@Param('id') id: string) {
    return this.queriesService.executeQuery(id);
  }

  /** GET /queries/:id/result — Ambil hasil terbaru (dari cache atau DB) */
  @Get(':id/result')
  getResult(@Param('id') id: string) {
    return this.queriesService.getQueryResult(id);
  }

  /** GET /queries/:id/history — Riwayat eksekusi */
  @Get(':id/history')
  getHistory(@Param('id') id: string) {
    return this.queriesService.getQueryHistory(id);
  }

  /** GET /queries/job-status/:jobId — Status BullMQ job */
  @Get('job-status/:jobId')
  async checkJobStatus(@Param('jobId') jobId: string) {
    return this.queriesService.getJobStatus(jobId);
  }

  // ── SCHEDULE ─────────────────────────────────────────────────────────────

  /** POST /queries/:id/schedule — Set atau update jadwal cron */
  @Post(':id/schedule')
  setSchedule(
    @Param('id') id: string,
    @Body() body: { cronExpression: string; isActive: boolean },
  ) {
    return this.queriesService.setSchedule(id, body);
  }

  // ── AI & TOOLS ────────────────────────────────────────────────────────────

  /** POST /queries/generate-sql — Generate SQL dengan AI */
  @Post('generate-sql')
  async generateSqlWithAI(@Body() body: { prompt: string; tableName: string }) {
    return this.queriesService.generateSql(body.prompt, body.tableName);
  }

  /** POST /queries/export/sheets — Export ke Google Sheets */
  @Post('export/sheets')
  async exportToSheets(
    @Body() body: { sheetId: string; tabName: string; columns: string[]; rows: any[] },
  ) {
    return this.googleSheetsService.exportData(body.sheetId, body.tabName, body.columns, body.rows);
  }
}