import { Controller, Get, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { AuditService } from './audit.service';
// Import guard autentikasi kamu di sini (misal JwtAuthGuard)
// import { JwtAuthGuard } from '../auth/jwt-auth.guard'; 

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  // @UseGuards(JwtAuthGuard) // Pastikan endpoint ini hanya bisa diakses user yang sudah login
  @Get('logs')
  async getLogs(@Req() req: any) {
    // Ambil data user dari token JWT yang divalidasi oleh Guard
    // const user = req.user; 

    // // Gembok Keamanan: Tendang keluar kalau bukan Admin/Owner
    // if (user?.role !== 'ADMIN' && user?.role !== 'OWNER') {
    //   throw new ForbiddenException('Akses ditolak: Hanya Admin platform yang berhak melihat CCTV.');
    // }

    return this.auditService.getAuditLogs();
  }
}