import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AirbyteService } from './airbyte.service';
import { AirbyteController } from './airbyte.controller';

@Module({
  imports: [HttpModule], 
  controllers: [AirbyteController],
  providers: [AirbyteService],
})
export class AirbyteModule {}