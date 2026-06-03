import { Controller, Get, Post, Delete, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TeamService } from './team.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  // Semua member tim bisa melihat daftar anggota
  @Get()
  getAllMembers(@Req() req: any) {
    const teamId = req.user.teamId;
    return this.teamService.getAllMembers(teamId);
  }

  // Hanya OWNER dan ADMIN yang bisa mengundang anggota baru
  @Post()
  @Roles(Role.OWNER, Role.ADMIN)
  addMember(@Req() req: any, @Body() body: { name: string; email: string; role: string }) {
    const inviterId = req.user.sub || req.user.id || req.user.userId;
    return this.teamService.addMember(inviterId, body);
  }

  // Hanya OWNER dan ADMIN yang bisa mengeluarkan anggota
  @Delete(':memberId')
  @Roles(Role.OWNER, Role.ADMIN)
  removeMember(@Req() req: any, @Param('memberId') memberId: string) {
    const requesterId = req.user.sub || req.user.id || req.user.userId;
    return this.teamService.removeMember(requesterId, memberId);
  }

  // Hanya OWNER yang bisa mengubah role (karena bisa naik ke ADMIN sekalipun)
  @Patch(':memberId/role')
  @Roles(Role.OWNER)
  updateMemberRole(
    @Req() req: any,
    @Param('memberId') memberId: string,
    @Body('role') role: string
  ) {
    const requesterId = req.user.sub || req.user.id || req.user.userId;
    return this.teamService.updateMemberRole(requesterId, memberId, role);
  }
}