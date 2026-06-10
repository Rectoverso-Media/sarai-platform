import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InsightsService } from './insights.service';
import { InsightType } from '@prisma/client';

@Controller('insights')
@UseGuards(AuthGuard('jwt'))
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  // GET /insights — List semua insight terbaru
  @Get()
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
  getSummary() {
    return this.insightsService.getInsightsSummary();
  }

  // POST /insights/generate/anomaly — Trigger manual Anomaly Detection
  @Post('generate/anomaly')
  generateAnomaly() {
    return this.insightsService.generateAnomalyDetection();
  }

  // POST /insights/generate/trend — Trigger manual Trend Analysis
  @Post('generate/trend')
  generateTrend() {
    return this.insightsService.generateTrendAnalysis();
  }

  // POST /insights/generate/period — Trigger manual Period Comparison
  @Post('generate/period')
  generatePeriod() {
    return this.insightsService.generatePeriodComparison();
  }

  // POST /insights/generate/forecast — Trigger manual Forecast
  @Post('generate/forecast')
  generateForecast() {
    return this.insightsService.generateForecast();
  }

  // POST /insights/generate/all — Trigger semua insight sekaligus
  @Post('generate/all')
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
