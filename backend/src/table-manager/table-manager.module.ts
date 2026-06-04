import { Module } from '@nestjs/common';
import { TableManagerService } from './table-manager.service';
import { TableManagerController } from './table-manager.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [TableManagerService],
  controllers: [TableManagerController],
  exports: [TableManagerService],
})
export class TableManagerModule {}
