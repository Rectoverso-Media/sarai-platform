import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueriesService } from './queries.service';
import { QueriesController } from './queries.controller';
import { QueryProcessor } from './queries.processor';
import { QueriesScheduler } from './queries.scheduler';
import { GoogleSheetsService } from './google-sheets.service';

import { PrismaModule } from '../prisma/prisma.module'; 

@Module({
  imports: [
    PrismaModule, 
    
    BullModule.registerQueue({
      name: 'query-execution',
    }),
  ],
  controllers: [QueriesController],
  providers: [QueriesService, QueryProcessor, QueriesScheduler, GoogleSheetsService],
})
export class QueriesModule {}