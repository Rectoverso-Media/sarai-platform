import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { InsightsService } from './insights.service';
import { InsightType } from '@prisma/client';

@ApiTags('AI Insights')
@ApiBearerAuth('JWT-auth')
@Controller('insights')
@UseGuards(AuthGuard('jwt'))
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  // GET /insights — List semua insight terbaru
  @Get()
  @ApiOperation({ summary: 'List insight AI terbaru (anomaly, trend, period, forecast)' })
  @ApiResponse({ status: 200, description: 'Daftar insight berhasil diambil' })
  getLatest(
    @Query('limit') limit?: string,
    @Query('type') type?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    const insightType = type as InsightType | undefined;
    return this.insightsService.getLatestInsights(parsedLimit, insightType);
  }

  // GET /insights/summary — Ringkasan 1 insight terbaru per tipe
  @Get('summary')
  @ApiOperation({ summary: 'Ringkasan insight terbaru — 1 per tipe' })
  @ApiResponse({ status: 200, description: 'Summary insight berhasil diambil' })
  getSummary() {
    return this.insightsService.getInsightsSummary();
  }

  // POST /insights/generate/anomaly — Trigger manual Anomaly Detection
  @Post('generate/anomaly')
  @ApiOperation({ summary: 'Trigger manual: generate Anomaly Detection insight' })
  @ApiResponse({ status: 201, description: 'Anomaly detection berhasil di-generate' })
  generateAnomaly() {
    return this.insightsService.generateAnomalyDetection();
  }

  // POST /insights/generate/trend — Trigger manual Trend Analysis
  @Post('generate/trend')
  @ApiOperation({ summary: 'Trigger manual: generate Trend Analysis insight' })
  @ApiResponse({ status: 201, description: 'Trend analysis berhasil di-generate' })
  generateTrend() {
    return this.insightsService.generateTrendAnalysis();
  }

  // POST /insights/generate/period — Trigger manual Period Comparison
  @Post('generate/period')
  @ApiOperation({ summary: 'Trigger manual: generate Period Comparison insight' })
  @ApiResponse({ status: 201, description: 'Period comparison berhasil di-generate' })
  generatePeriod() {
    return this.insightsService.generatePeriodComparison();
  }

  // POST /insights/generate/forecast — Trigger manual Forecast
  @Post('generate/forecast')
  @ApiOperation({ summary: 'Trigger manual: generate Forecast insight' })
  @ApiResponse({ status: 201, description: 'Forecast berhasil di-generate' })
  generateForecast() {
    return this.insightsService.generateForecast();
  }

  // POST /insights/generate/all — Trigger semua insight sekaligus
  @Post('generate/all')
  @ApiOperation({ summary: 'Trigger semua insight sekaligus (anomaly, trend, period, forecast)' })
  @ApiResponse({ status: 201, description: 'Semua insight berhasil di-generate' })
  async generateAll() {
    const results = await Promise.allSettled([
      this.insightsService.generateAnomalyDetection(),
      this.insightsService.generateTrendAnalysis(),
      this.insightsService.generatePeriodComparison(),
      this.insightsService.generateForecast(),
    ]);
    return {
      message: 'Semua insight berhasil di-generate',
      results: results.map((r, i) => ({
        type: ['ANOMALY', 'TREND', 'PERIOD', 'FORECAST'][i],
        status: r.status,
      })),
    };
  }

  // GET /insights/types — List tipe insight yang tersedia
  @Get('types')
  @ApiOperation({ summary: 'List tipe insight yang tersedia' })
  @ApiResponse({ status: 200, description: 'Daftar tipe insight berhasil diambil' })
  getTypes() {
    return Object.values(InsightType).map((type) => ({
      type,
      label: {
        TREND_ANALYSIS: 'Trend Analysis',
        ANOMALY_DETECTION: 'Anomaly Detection',
        PERIOD_COMPARISON: 'Period Comparison',
        FORECAST: 'Forecast',
      }[type],
    }));
  }
}
