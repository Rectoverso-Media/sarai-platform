import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  // Hanya OWNER dan ADMIN yang bisa melihat audit log
  @Get('logs')
  @Roles(Role.OWNER, Role.ADMIN)
  async getLogs() {
    return this.auditService.getAuditLogs();
  }
}