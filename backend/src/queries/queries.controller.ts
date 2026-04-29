import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { QueriesService } from './queries.service';
import { GoogleSheetsService } from '../integrations/google-sheets/google-sheets.service';

@Controller('queries')
export class QueriesController {
  constructor(private readonly queriesService: QueriesService, private readonly googleSheetsService: GoogleSheetsService) {}

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

  @Post('test-queue')
  async testQueue(@Body() body: { queryId: string, rawSql: string }) {
    return this.queriesService.triggerQueryExecution(body.queryId, body.rawSql);
  }

  @Get('job-status/:jobId')
  async checkJobStatus(@Param('jobId') jobId: string) {
    return this.queriesService.getJobStatus(jobId);
  }

  @Get('schema/:tableName')
  async getTableSchema(@Param('tableName') tableName: string) {
    return this.queriesService.getTableColumns(tableName);
  }

  @Post('export/sheets')
  async exportToSheets(
    @Body() body: { sheetId: string; tabName: string; columns: string[]; rows: any[] }
  ) {
    // Controller menerima data dari Frontend, lalu menyuruh Service kurir untuk bekerja
    return this.googleSheetsService.exportData(
      body.sheetId,
      body.tabName,
      body.columns,
      body.rows
    );
  }

}