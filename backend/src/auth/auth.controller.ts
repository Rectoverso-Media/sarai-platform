import { Controller, Get, Post, Body, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Post('login')
  login(@Body() body: any) {
    return this.authService.login(body);
  }

  // 1. Rute ini yang ditembak dari tombol "Google" di Frontend
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {
    // Akan otomatis di-handle oleh GoogleStrategy
  }

  // 2. Rute ini adalah Callback yang menerima data dari Google
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const result = await this.authService.validateGoogleUser(req.user);
    
    // Kita lempar balik ke frontend sambil bawa token di URL
    // Frontend nanti yang bertugas nangkap token ini dan masukin ke LocalStorage
    const frontendUrl = `http://localhost:3000/login?token=${result.access_token}&userData=${encodeURIComponent(JSON.stringify(result.user))}`;
    
    res.redirect(frontendUrl);
  }
}