import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueriesService } from './queries.service';
import { QueriesController } from './queries.controller';
import { QueryProcessor } from './queries.processor';
import { QueriesScheduler } from './queries.scheduler';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'query-execution',
    }),
  ],
  controllers: [QueriesController],
  providers: [QueriesService, QueryProcessor, QueriesScheduler],
})
export class QueriesModule {}