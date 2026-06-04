import { Module } from '@nestjs/common';
import { BlendsService } from './blends.service';
import { BlendsController } from './blends.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BlendsController],
  providers: [BlendsService],
  exports: [BlendsService],
})
export class BlendsModule {}
