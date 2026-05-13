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
import { APP_GUARD } from '@nestjs/core';
import { AiModule } from './ai/ai.module';
import { ExportModule } from './export/export.module';
import { InsightsService } from './insights/insights.service';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [UsersModule, DatasourcesModule, InfrastructureModule, TeamModule, 
            SecurityModule, AuthModule, AirbyteModule, QueriesModule, ScheduleModule.forRoot(), 
            AirbyteModule, QueriesModule, DataTransfersModule, PrismaModule,
          // 1. Setup Koneksi Utama ke Redis Upstash
            BullModule.forRoot({
              connection: {
                host: 'refined-chigger-107480.upstash.io',
                port: 6379, // Biasanya 6379 atau cek di dashboard Upstash
                username: 'default',
                password: 'gQAAAAAAAaPYAAIgcDEwZDI0MTg0ODFkNDI0MjRlYWZjZTkyMzUyZTlmNDcxNQ',
                tls: {}, // WAJIB ADA buat Upstash karena mereka pakai SSL
              },
            }),


            ThrottlerModule.forRoot([{
              ttl: 60000, // Waktu blokir (60.000 ms = 1 menit)
              limit: 20,  // Maksimal 20 request per menit
            }]),
          DashboardModule,
          EmailModule,
          AiModule,
          ExportModule,],
  controllers: [AppController],
  providers: [AppService,
              {
                provide: APP_GUARD,
                useClass: ThrottlerGuard,
              },
              InsightsService,
  ],
})
export class AppModule {}
