import { Module } from '@nestjs/common';
import { AirbyteService } from './airbyte.service';
import { AirbyteController } from './airbyte.controller';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [HttpModule, PrismaModule, NotificationsModule],
  controllers: [AirbyteController],
  providers: [AirbyteService],
  exports: [AirbyteService],
})
export class AirbyteModule {}