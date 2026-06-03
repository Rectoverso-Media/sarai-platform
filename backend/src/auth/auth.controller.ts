import {
  Controller, Get, Post, Body, Req, Res, UseGuards, Query, BadRequestException
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from './roles.guard';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ==========================================
  // REGISTER & LOGIN
  // ==========================================
  @Post('register')
  register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Post('login')
  login(@Body() body: any) {
    return this.authService.login(body);
  }

  // ==========================================
  // GOOGLE OAUTH
  // ==========================================
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {
    // Otomatis di-handle oleh GoogleStrategy
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const result = await this.authService.validateGoogleUser(req.user);
    const frontendUrl = `http://localhost:3000/login?token=${result.access_token}&userData=${encodeURIComponent(JSON.stringify(result.user))}`;
    res.redirect(frontendUrl);
  }

  // ==========================================
  // EMAIL VERIFICATION
  // ==========================================
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
    await this.authService.verifyEmail(token);
    res.redirect('http://localhost:3000/login?verified=true');
  }

  // ==========================================
  // PASSWORD RESET
  // ==========================================
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  // ==========================================
  // TEAM INVITE
  // ==========================================
  @Post('accept-invite')
  async acceptInvite(@Body() body: { token: string; password: string }) {
    if (!body.token || !body.password) {
      throw new BadRequestException('Token dan password harus diisi');
    }
    return this.authService.acceptInvite(body.token, body.password);
  }

  // ==========================================
  // REFRESH TOKEN — POST /auth/refresh
  // Body: { refresh_token: string }
  // ==========================================
  @Post('refresh')
  async refresh(@Body('refresh_token') refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('refresh_token harus disertakan');
    }
    return this.authService.refreshToken(refreshToken);
  }

  // ==========================================
  // LOGOUT — POST /auth/logout
  // Requires JWT. Body: { refresh_token?: string }
  // ==========================================
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() req: any, @Body('refresh_token') refreshToken?: string) {
    const userId = req.user.userId || req.user.sub;
    return this.authService.logout(userId, refreshToken);
  }

  // ==========================================
  // 2FA ENDPOINTS
  // ==========================================

  // Step 1: Minta QR Code untuk setup 2FA
  // POST /auth/2fa/enable
  @Post('2fa/enable')
  @UseGuards(AuthGuard('jwt'))
  async enable2FA(@Req() req: any) {
    const userId = req.user.userId || req.user.sub;
    return this.authService.enable2FA(userId);
  }

  // Step 2: Verifikasi kode TOTP untuk mengaktifkan 2FA
  // POST /auth/2fa/verify
  @Post('2fa/verify')
  @UseGuards(AuthGuard('jwt'))
  async verify2FA(@Req() req: any, @Body('code') code: string) {
    if (!code) {
      throw new BadRequestException('Kode 2FA harus diisi');
    }
    const userId = req.user.userId || req.user.sub;
    return this.authService.verify2FA(userId, code);
  }

  // Step 3: Login dengan kode 2FA setelah password login
  // POST /auth/2fa/login
  // Body: { tempToken: string, code: string }
  @Post('2fa/login')
  async loginWith2FA(@Body() body: { tempToken: string; code: string }) {
    if (!body.tempToken || !body.code) {
      throw new BadRequestException('tempToken dan code harus diisi');
    }
    return this.authService.loginWith2FA(body.tempToken, body.code);
  }

  // Step 4: Nonaktifkan 2FA (butuh verifikasi TOTP)
  // POST /auth/2fa/disable
  @Post('2fa/disable')
  @UseGuards(AuthGuard('jwt'))
  async disable2FA(@Req() req: any, @Body('code') code: string) {
    if (!code) {
      throw new BadRequestException('Kode 2FA harus diisi untuk menonaktifkan');
    }
    const userId = req.user.userId || req.user.sub;
    return this.authService.disable2FA(userId, code);
  }
}