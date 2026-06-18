import {
  Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { QueriesService } from './queries.service';
import { GoogleSheetsService } from '../integrations/google-sheets/google-sheets.service';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Queries')
@ApiBearerAuth('JWT-auth')
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
  @ApiOperation({ summary: 'Buat query SQL baru' })
  @ApiResponse({ status: 201, description: 'Query berhasil dibuat' })
  create(@Body() body: any, @Request() req: any) {
    return this.queriesService.createQuery({
      ...body,
      createdById: req.user?.id,
      teamId: body.teamId ?? req.user?.teamId,
    });
  }

  /** GET /queries — List semua query (filter per team) */
  @Get()
  @ApiOperation({ summary: 'List semua query milik team' })
  @ApiResponse({ status: 200, description: 'Daftar query berhasil diambil' })
  findAll(@Request() req: any, @Query('teamId') teamId?: string) {
    // Gunakan teamId dari query param, fallback ke teamId user dari JWT
    return this.queriesService.getAllQueries(teamId ?? req.user?.teamId);
  }

  /** GET /queries/synced-tables — List stream yang tersedia di synced_data */
  @Get('synced-tables')
  @ApiOperation({ summary: 'List tabel/stream synced data yang tersedia untuk query' })
  @ApiResponse({ status: 200, description: 'Daftar synced tables berhasil diambil' })
  getSyncedTables() {
    return this.queriesService.getSyncedTables();
  }

  /** GET /queries/schema/:streamName — Kolom dari stream tertentu */
  @Get('schema/:tableName')
  @ApiOperation({ summary: 'Ambil schema (kolom) dari tabel/stream tertentu' })
  @ApiResponse({ status: 200, description: 'Schema berhasil diambil' })
  async getTableSchema(@Param('tableName') tableName: string) {
    return this.queriesService.getTableColumns(tableName);
  }

  /** GET /queries/:id — Detail satu query */
  @Get(':id')
  @ApiOperation({ summary: 'Detail query beserta konfigurasi SQL' })
  @ApiResponse({ status: 200, description: 'Detail query berhasil diambil' })
  @ApiResponse({ status: 404, description: 'Query tidak ditemukan' })
  findOne(@Param('id') id: string) {
    return this.queriesService.getQueryById(id);
  }

  /** DELETE /queries/:id — Hapus query */
  @Delete(':id')
  @ApiOperation({ summary: 'Hapus query' })
  @ApiResponse({ status: 200, description: 'Query berhasil dihapus' })
  remove(@Param('id') id: string) {
    return this.queriesService.deleteQuery(id);
  }

  // ── EXECUTION ────────────────────────────────────────────────────────────

  /** POST /queries/:id/execute — Jalankan query (async via BullMQ) */
  @Post(':id/execute')
  @ApiOperation({ summary: 'Eksekusi query secara async via BullMQ queue' })
  @ApiResponse({ status: 200, description: 'Query berhasil di-queue, return job ID' })
  execute(@Param('id') id: string) {
    return this.queriesService.executeQuery(id);
  }

  /** GET /queries/:id/result — Ambil hasil terbaru (dari cache atau DB) */
  @Get(':id/result')
  @ApiOperation({ summary: 'Ambil hasil eksekusi terbaru dari query' })
  @ApiResponse({ status: 200, description: 'Hasil query berhasil diambil' })
  getResult(@Param('id') id: string) {
    return this.queriesService.getQueryResult(id);
  }

  /** GET /queries/:id/history — Riwayat eksekusi */
  @Get(':id/history')
  @ApiOperation({ summary: 'Riwayat eksekusi query (semua run)' })
  @ApiResponse({ status: 200, description: 'Riwayat eksekusi berhasil diambil' })
  getHistory(@Param('id') id: string) {
    return this.queriesService.getQueryHistory(id);
  }

  /** GET /queries/job-status/:jobId — Status BullMQ job */
  @Get('job-status/:jobId')
  @ApiOperation({ summary: 'Cek status BullMQ job berdasarkan job ID' })
  @ApiResponse({ status: 200, description: 'Status job berhasil diambil' })
  async checkJobStatus(@Param('jobId') jobId: string) {
    return this.queriesService.getJobStatus(jobId);
  }

  // ── SCHEDULE ─────────────────────────────────────────────────────────────

  /** POST /queries/:id/schedule — Set atau update jadwal cron */
  @Post(':id/schedule')
  @ApiOperation({ summary: 'Set atau update jadwal cron untuk auto-execute query' })
  @ApiResponse({ status: 200, description: 'Schedule berhasil diset' })
  setSchedule(
    @Param('id') id: string,
    @Body() body: { cronExpression: string; isActive: boolean },
  ) {
    return this.queriesService.setSchedule(id, body);
  }

  // ── AI & TOOLS ────────────────────────────────────────────────────────────

  /** POST /queries/generate-sql — Generate SQL dengan AI */
  @Post('generate-sql')
  @ApiOperation({ summary: 'Generate SQL statement dari prompt bahasa natural via AI' })
  @ApiResponse({ status: 200, description: 'SQL berhasil di-generate' })
  async generateSqlWithAI(@Body() body: { prompt: string; tableName: string }) {
    return this.queriesService.generateSql(body.prompt, body.tableName);
  }

  /** POST /queries/export/sheets — Export ke Google Sheets */
  @Post('export/sheets')
  @ApiOperation({ summary: 'Export data query ke Google Sheets' })
  @ApiResponse({ status: 200, description: 'Data berhasil diexport ke Google Sheets' })
  async exportToSheets(
    @Body() body: { sheetId: string; tabName: string; columns: string[]; rows: any[] },
  ) {
    return this.googleSheetsService.exportData(body.sheetId, body.tabName, body.columns, body.rows);
  }
}