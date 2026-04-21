import { Controller, Get, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // Pintu buat Register (http://localhost:3001/users)
  @Post()
  create(@Body() body: { name: string; email: string; password: string }) {
    return this.usersService.create(body);
  }

  // Pintu baru buat Login (http://localhost:3001/users/login)
  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.usersService.login(body);
  }
}