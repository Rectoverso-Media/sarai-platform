import { Controller, Get, Post, Delete, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TeamService } from './team.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Team')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  // Semua member tim bisa melihat daftar anggota
  @Get()
  @ApiOperation({ summary: 'List semua anggota tim' })
  @ApiResponse({ status: 200, description: 'Daftar anggota tim berhasil diambil' })
  getAllMembers(@Req() req: any) {
    const teamId = req.user.teamId;
    return this.teamService.getAllMembers(teamId);
  }

  // Hanya OWNER dan ADMIN yang bisa mengundang anggota baru
  @Post()
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Undang anggota baru ke tim (ADMIN/OWNER only)' })
  @ApiResponse({ status: 201, description: 'Undangan berhasil dikirim' })
  @ApiResponse({ status: 403, description: 'Akses ditolak — butuh role ADMIN atau OWNER' })
  addMember(@Req() req: any, @Body() body: { name: string; email: string; role: string }) {
    const inviterId = req.user.sub || req.user.id || req.user.userId;
    return this.teamService.addMember(inviterId, body);
  }

  // Hanya OWNER dan ADMIN yang bisa mengeluarkan anggota
  @Delete(':memberId')
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Keluarkan anggota dari tim (ADMIN/OWNER only)' })
  @ApiResponse({ status: 200, description: 'Anggota berhasil dikeluarkan' })
  @ApiResponse({ status: 403, description: 'Akses ditolak' })
  removeMember(@Req() req: any, @Param('memberId') memberId: string) {
    const requesterId = req.user.sub || req.user.id || req.user.userId;
    return this.teamService.removeMember(requesterId, memberId);
  }

  // Hanya OWNER yang bisa mengubah role (karena bisa naik ke ADMIN sekalipun)
  @Patch(':memberId/role')
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Ubah role anggota tim (OWNER only)' })
  @ApiResponse({ status: 200, description: 'Role berhasil diubah' })
  @ApiResponse({ status: 403, description: 'Akses ditolak — hanya OWNER' })
  updateMemberRole(
    @Req() req: any,
    @Param('memberId') memberId: string,
    @Body('role') role: string
  ) {
    const requesterId = req.user.sub || req.user.id || req.user.userId;
    return this.teamService.updateMemberRole(requesterId, memberId, role);
  }
}