import { Module } from '@nestjs/common';
import { ApiQueriesService } from './api-queries.service';
import { ApiQueriesController } from './api-queries.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ApiQueriesService],
  controllers: [ApiQueriesController],
  exports: [ApiQueriesService],
})
export class ApiQueriesModule {}
