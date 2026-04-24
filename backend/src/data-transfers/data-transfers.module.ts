import { Module } from '@nestjs/common';
import { DataTransfersService } from './data-transfers.service';
import { DataTransfersController } from './data-transfers.controller';

@Module({
  providers: [DataTransfersService],
  controllers: [DataTransfersController]
})
export class DataTransfersModule {}
