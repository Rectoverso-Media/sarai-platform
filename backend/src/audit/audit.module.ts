import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditInterceptor } from './audit.interceptor';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [PrismaModule, AuthModule, PassportModule],
  providers: [AuditService, AuditInterceptor],
  controllers: [AuditController],
  exports: [AuditInterceptor, AuditService],
})
export class AuditModule {}
