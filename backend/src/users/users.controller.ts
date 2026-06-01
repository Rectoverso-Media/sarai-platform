import { Controller, Get, Post, Patch, Body } from '@nestjs/common';
import { UsersService } from './users.service';

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

  // PINTU BARU BUAT UPDATE PROFIL (http://localhost:3001/users/profile) 
  @Patch('profile')
  updateProfile(@Body() body: { userId: string; name?: string; password?: string }) {
    // Karena belum ada token JWT, kita minta frontend ngirim userId di dalam body
    const { userId, name, password } = body;
    return this.usersService.updateProfile(userId, { name, password });
  }
}