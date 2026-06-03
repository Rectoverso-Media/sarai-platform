import { Module } from '@nestjs/common';
import { DatasourcesService } from './datasources.service';
import { DatasourcesController } from './datasources.controller';
import { TrialService } from './trial.service';
import { DatasourcesScheduler } from './datasources-scheduler';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [DatasourcesController],
  providers: [DatasourcesService, TrialService, DatasourcesScheduler],
  exports: [DatasourcesService, TrialService],
})
export class DatasourcesModule {}