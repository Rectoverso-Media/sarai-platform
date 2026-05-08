import { Module } from '@nestjs/common';
import { AirbyteService } from './airbyte.service';
import { AirbyteController } from './airbyte.controller';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../prisma/prisma.module'; 

@Module({
  imports: [HttpModule, PrismaModule], 
  controllers: [AirbyteController],
  providers: [AirbyteService],
})
export class AirbyteModule {}