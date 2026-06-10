import { Module } from '@nestjs/common';
import { DataExplorerService } from './data-explorer.service';
import { DataExplorerController } from './data-explorer.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DataExplorerController],
  providers: [DataExplorerService],
})
export class DataExplorerModule {}
