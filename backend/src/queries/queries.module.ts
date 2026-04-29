import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueriesService } from './queries.service';
import { QueriesController } from './queries.controller';
import { QueryProcessor } from './queries.processor';
import { QueriesScheduler } from './queries.scheduler';
// import { GoogleSheetsService } from '../integrations/google-sheets/google-sheets.service';

import { PrismaModule } from '../prisma/prisma.module'; 
import { GoogleSheetsModule } from '../integrations/google-sheets/google-sheets.module';

@Module({
  imports: [
    PrismaModule, 
    
    BullModule.registerQueue({
      name: 'query-execution',
    }),
    GoogleSheetsModule,
  ],
  controllers: [QueriesController],
  providers: [QueriesService, QueryProcessor, QueriesScheduler, GoogleSheetsModule],
})
export class QueriesModule {}