import {
  Controller, Get, Post, Body, Req, Res, UseGuards, Query, BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from './roles.guard';
import type { Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ==========================================
  // REGISTER & LOGIN
  // ==========================================
  @Post('register')
  @ApiOperation({ summary: 'Registrasi user baru' })
  @ApiResponse({ status: 201, description: 'User berhasil didaftarkan' })
  @ApiResponse({ status: 400, description: 'Data registrasi tidak valid' })
  register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login dengan email dan password' })
  @ApiResponse({ status: 200, description: 'Login berhasil, return JWT tokens' })
  @ApiResponse({ status: 401, description: 'Email atau password salah' })
  login(@Body() body: any) {
    return this.authService.login(body);
  }

  // ==========================================
  // GOOGLE OAUTH
  // ==========================================
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Redirect ke Google OAuth consent screen' })
  async googleAuth(@Req() req) {
    // Otomatis di-handle oleh GoogleStrategy
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Callback dari Google OAuth' })
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const result = await this.authService.validateGoogleUser(req.user);
    const frontendUrl = `http://localhost:3000/login?token=${result.access_token}&userData=${encodeURIComponent(JSON.stringify(result.user))}`;
    res.redirect(frontendUrl);
  }

  // ==========================================
  // EMAIL VERIFICATION
  // ==========================================
  @Get('verify-email')
  @ApiOperation({ summary: 'Verifikasi email via token dari link email' })
  @ApiResponse({ status: 302, description: 'Redirect ke login setelah verifikasi berhasil' })
  @ApiResponse({ status: 400, description: 'Token verifikasi tidak valid atau expired' })
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
    await this.authService.verifyEmail(token);
    res.redirect('http://localhost:3000/login?verified=true');
  }

  // ==========================================
  // PASSWORD RESET
  // ==========================================
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request reset password via email' })
  @ApiResponse({ status: 200, description: 'Email reset password terkirim' })
  @ApiResponse({ status: 404, description: 'Email tidak ditemukan' })
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password dengan token dari email' })
  @ApiResponse({ status: 200, description: 'Password berhasil direset' })
  @ApiResponse({ status: 400, description: 'Token tidak valid atau expired' })
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  // ==========================================
  // TEAM INVITE
  // ==========================================
  @Post('accept-invite')
  @ApiOperation({ summary: 'Terima undangan tim dan buat akun' })
  @ApiResponse({ status: 200, description: 'Undangan diterima, akun dibuat' })
  @ApiResponse({ status: 400, description: 'Token atau password tidak valid' })
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
  @ApiOperation({ summary: 'Refresh access token menggunakan refresh token' })
  @ApiResponse({ status: 200, description: 'Token baru berhasil dibuat' })
  @ApiResponse({ status: 400, description: 'Refresh token tidak valid' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout dan invalidate refresh token' })
  @ApiResponse({ status: 200, description: 'Logout berhasil' })
  @ApiResponse({ status: 401, description: 'Token tidak valid' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Generate QR code untuk setup 2FA (TOTP)' })
  @ApiResponse({ status: 200, description: 'QR code URL berhasil di-generate' })
  async enable2FA(@Req() req: any) {
    const userId = req.user.userId || req.user.sub;
    return this.authService.enable2FA(userId);
  }

  // Step 2: Verifikasi kode TOTP untuk mengaktifkan 2FA
  // POST /auth/2fa/verify
  @Post('2fa/verify')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Verifikasi kode TOTP untuk mengaktifkan 2FA' })
  @ApiResponse({ status: 200, description: '2FA berhasil diaktifkan' })
  @ApiResponse({ status: 400, description: 'Kode TOTP tidak valid' })
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
  @ApiOperation({ summary: 'Login 2FA — verifikasi kode TOTP setelah password login' })
  @ApiResponse({ status: 200, description: 'Login 2FA berhasil, return JWT tokens' })
  @ApiResponse({ status: 400, description: 'Temp token atau kode TOTP tidak valid' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Nonaktifkan 2FA (membutuhkan kode TOTP aktif)' })
  @ApiResponse({ status: 200, description: '2FA berhasil dinonaktifkan' })
  @ApiResponse({ status: 400, description: 'Kode TOTP tidak valid' })
  async disable2FA(@Req() req: any, @Body('code') code: string) {
    if (!code) {
      throw new BadRequestException('Kode 2FA harus diisi untuk menonaktifkan');
    }
    const userId = req.user.userId || req.user.sub;
    return this.authService.disable2FA(userId, code);
  }
}