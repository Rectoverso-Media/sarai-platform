import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueriesService } from './queries.service';
import { QueriesController } from './queries.controller';
import { QueryProcessor } from './queries.processor';
import { QueriesScheduler } from './queries.scheduler';

import { PrismaModule } from '../prisma/prisma.module';
import { GoogleSheetsModule } from '../integrations/google-sheets/google-sheets.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    BullModule.registerQueue({
      name: 'query-execution',
    }),
    GoogleSheetsModule,
  ],
  controllers: [QueriesController],
  providers: [QueriesService, QueryProcessor, QueriesScheduler],
  exports: [QueriesService],
})
export class QueriesModule {}