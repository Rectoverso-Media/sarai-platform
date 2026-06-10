import { Module } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { GoogleSheetsModule } from './google-sheets/google-sheets.module';
import { ExcelModule } from './excel/excel.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, GoogleSheetsModule, ExcelModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
