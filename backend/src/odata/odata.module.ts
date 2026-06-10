import { Module } from '@nestjs/common';
import { ODataService } from './odata.service';
import { ODataController } from './odata.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ODataController],
  providers: [ODataService],
})
export class ODataModule {}
