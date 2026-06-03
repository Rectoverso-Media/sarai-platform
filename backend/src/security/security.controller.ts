import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SecurityService } from './security.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  // Hanya OWNER dan ADMIN yang bisa melihat audit log keamanan
  @Get()
  @Roles(Role.OWNER, Role.ADMIN)
  findAll() {
    return this.securityService.findAll();
  }

  // Hanya sistem (OWNER/ADMIN) yang bisa mencatat aksi
  @Post()
  @Roles(Role.OWNER, Role.ADMIN)
  logAction(@Body() body: { action: string; actor: string; details?: string; ipAddress?: string }) {
    return this.securityService.logAction(body);
  }
}