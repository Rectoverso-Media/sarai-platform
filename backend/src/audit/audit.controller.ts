import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Audit')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  // Hanya OWNER dan ADMIN yang bisa melihat audit log
  @Get('logs')
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Ambil semua audit log (ADMIN/OWNER only)' })
  @ApiResponse({ status: 200, description: 'Daftar audit log berhasil diambil' })
  @ApiResponse({ status: 403, description: 'Akses ditolak — butuh role ADMIN atau OWNER' })
  async getLogs() {
    return this.auditService.getAuditLogs();
  }
}