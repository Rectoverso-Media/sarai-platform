import { Controller, Get, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('logs')
  async getLogs(@Req() req: any) {
    const user = req.user;

    // Gembok Keamanan: Hanya Admin/Owner yang bisa akses CCTV ini
    if (user?.role !== 'ADMIN' && user?.role !== 'OWNER') {
      throw new ForbiddenException('Akses ditolak: Hanya Admin platform yang berhak melihat log audit.');
    }

    return this.auditService.getAuditLogs();
  }
}