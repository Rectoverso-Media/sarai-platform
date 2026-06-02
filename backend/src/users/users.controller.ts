import { Controller, Get, Post, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  create(@Body() body: { name: string; email: string; password: string }) {
    return this.usersService.create(body);
  }

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.usersService.login(body);
  }

  // PINTU UPDATE PROFIL (Hanya user yang login) → http://localhost:3001/users/profile
  @UseGuards(AuthGuard('jwt'))
  @Patch('profile')
  updateProfile(@Req() req: any, @Body() body: { name?: string; password?: string }) {
    // Ambil userId dari JWT token — lebih aman daripada dari body
    const userId = req.user.sub || req.user.id;
    return this.usersService.updateProfile(userId, body);
  }
}