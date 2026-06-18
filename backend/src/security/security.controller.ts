import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SecurityService } from './security.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Security')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  // Hanya OWNER dan ADMIN yang bisa melihat audit log keamanan
  @Get()
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'List semua security log (ADMIN/OWNER only)' })
  @ApiResponse({ status: 200, description: 'Daftar security log berhasil diambil' })
  @ApiResponse({ status: 403, description: 'Akses ditolak — butuh role ADMIN atau OWNER' })
  findAll() {
    return this.securityService.findAll();
  }

  // Hanya sistem (OWNER/ADMIN) yang bisa mencatat aksi
  @Post()
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Log aksi keamanan baru (ADMIN/OWNER only)' })
  @ApiResponse({ status: 201, description: 'Security log berhasil dicatat' })
  @ApiResponse({ status: 403, description: 'Akses ditolak — butuh role ADMIN atau OWNER' })
  logAction(@Body() body: { action: string; actor: string; details?: string; ipAddress?: string }) {
    return this.securityService.logAction(body);
  }
}