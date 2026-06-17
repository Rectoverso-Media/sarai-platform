import { Controller, Get, Post, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users — Hanya ADMIN dan OWNER yang boleh list semua user
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  @Get()
  @ApiOperation({ summary: 'List semua user (ADMIN/OWNER only)' })
  @ApiResponse({ status: 200, description: 'Daftar user berhasil diambil' })
  @ApiResponse({ status: 403, description: 'Akses ditolak — butuh role ADMIN atau OWNER' })
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Buat user baru (internal, gunakan POST /auth/register)' })
  create(@Body() body: { name: string; email: string; password: string }) {
    return this.usersService.create(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user (deprecated, gunakan POST /auth/login)' })
  login(@Body() body: { email: string; password: string }) {
    return this.usersService.login(body);
  }

  // PINTU UPDATE PROFIL (Hanya user yang login) → http://localhost:3001/users/profile
  @UseGuards(AuthGuard('jwt'))
  @Patch('profile')
  @ApiOperation({ summary: 'Update profil user yang sedang login' })
  @ApiResponse({ status: 200, description: 'Profil berhasil diupdate' })
  @ApiResponse({ status: 401, description: 'Token tidak valid atau expired' })
  updateProfile(@Req() req: any, @Body() body: { name?: string; password?: string }) {
    // Ambil userId dari JWT token — lebih aman daripada dari body
    const userId = req.user.sub || req.user.id;
    return this.usersService.updateProfile(userId, body);
  }
}