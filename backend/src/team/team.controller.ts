import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { TeamService } from './team.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt')) // 👈 Wajib login untuk akses semua rute Team
@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  getAllMembers(@Req() req: any) {
    // Ambil teamId dari orang yang lagi login
    const teamId = req.user.teamId; 
    return this.teamService.getAllMembers(teamId);
  }

  @Post()
  addMember(@Req() req: any, @Body() body: { name: string; email: string; role: string }) {
    // Ambil ID dari orang yang lagi login (si pengundang)
    const inviterId = req.user.sub || req.user.id || req.user.userId;
    return this.teamService.addMember(inviterId, body);
  }
}