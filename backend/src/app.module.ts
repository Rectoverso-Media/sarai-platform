import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from './users/users.module';
import { DatasourcesModule } from './datasources/datasources.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { TeamModule } from './team/team.module';
import { SecurityModule } from './security/security.module';
import { AuthModule } from './auth/auth.module';
import { AirbyteModule } from './airbyte/airbyte.module';
import { QueriesModule } from './queries/queries.module';
import { DataTransfersModule } from './data-transfers/data-transfers.module';
import { BullModule } from '@nestjs/bullmq';
import { DashboardModule } from './dashboard/dashboard.module';
import { EmailModule } from './email/email.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AiModule } from './ai/ai.module';
import { ExportModule } from './export/export.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { AuditInterceptor } from './audit/audit.interceptor';
import { NotificationsModule } from './notifications/notifications.module';
import { CustomFieldsModule } from './custom-fields/custom-fields.module';
import { BlendsModule } from './blends/blends.module';
import { ApiQueriesModule } from './api-queries/api-queries.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { TableManagerModule } from './table-manager/table-manager.module';
import { DataExplorerModule } from './data-explorer/data-explorer.module';
import { InsightsModule } from './insights/insights.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { ExcelModule } from './integrations/excel/excel.module';
import { ODataModule } from './odata/odata.module';
import { BillingModule } from './billing/billing.module';

@Module({
  imports: [
    AuditModule,
    UsersModule,
    DatasourcesModule,
    InfrastructureModule,
    TeamModule,
    SecurityModule,
    AuthModule,
    AirbyteModule,
    QueriesModule,
    DataTransfersModule,
    PrismaModule,
    ScheduleModule.forRoot(),

    // Setup Koneksi Utama ke Redis via environment variables
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
        username: 'default',
        password: process.env.REDIS_PASSWORD,
        tls: {}, // WAJIB untuk Upstash karena menggunakan SSL
      },
    }),

    ThrottlerModule.forRoot([{
      ttl: 60000, // Waktu blokir (60.000 ms = 1 menit)
      limit: 20,  // Maksimal 20 request per menit
    }]),

    DashboardModule,
    EmailModule,
    AiModule,
    ExportModule,
    NotificationsModule,
    CustomFieldsModule,
    BlendsModule,
    ApiQueriesModule,
    WarehouseModule,
    TableManagerModule,
    DataExplorerModule,
    InsightsModule,
    IntegrationsModule,
    ExcelModule,
    ODataModule,
    BillingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,

    // Rate Limiting (ThrottlerGuard)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },

    // Audit Log Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
