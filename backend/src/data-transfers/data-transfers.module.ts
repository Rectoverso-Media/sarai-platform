import { Module } from '@nestjs/common';
import { DataTransfersService } from './data-transfers.service';
import { DataTransfersController } from './data-transfers.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DataTransfersService],
  controllers: [DataTransfersController]
})
export class DataTransfersModule {}
