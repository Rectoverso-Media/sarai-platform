import { Controller, Get, Post, Body } from '@nestjs/common';
import { SecurityService } from './security.service';

@Controller('security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get()
  findAll() {
    return this.securityService.findAll();
  }

  @Post()
  logAction(@Body() body: { action: string; actor: string; details?: string; ipAddress?: string }) {
    return this.securityService.logAction(body);
  }
}