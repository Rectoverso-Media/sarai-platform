import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { Role } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService
  ) {}

  // ==========================================
  // 1. FUNGSI REGISTER
  // ==========================================
  async register(data: { name: string; email: string; password: string; role?: Role }) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new BadRequestException('Email sudah terdaftar!');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role || Role.VIEWER,
      },
    });

    const verifyToken = this.jwtService.sign(
      { email: user.email, purpose: 'email_verification' },
      { expiresIn: '1h' }
    );

    this.emailService.sendVerificationEmail(user.email, verifyToken);

    const { password, twoFactorSecret, ...userWithoutSensitive } = user;
    return { message: 'Registrasi sukses! Silakan cek email untuk verifikasi.', user: userWithoutSensitive };
  }

  // ==========================================
  // 2. FUNGSI LOGIN (Dengan dukungan 2FA)
  // ==========================================
  async login(data: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: data.email } });

    if (!user || !user.password) {
      throw new UnauthorizedException('Email atau Password salah!');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau Password salah!');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Email belum diverifikasi. Silakan cek inbox dan klik link verifikasi.');
    }

    // Jika 2FA aktif, jangan langsung beri access token — minta TOTP dulu
    if (user.isTwoFactorEnabled) {
      // Buat temp token (berlaku 5 menit) untuk proses verifikasi 2FA
      const tempToken = this.jwtService.sign(
        { sub: user.id, purpose: '2fa_verification' },
        { expiresIn: '5m' }
      );

      // Simpan temp token ke DB agar bisa diverifikasi nanti
      await this.prisma.user.update({
        where: { id: user.id },
        data: { twoFactorTempToken: tempToken },
      });

      return {
        requires2FA: true,
        tempToken,
        message: 'Masukkan kode 6-digit dari aplikasi authenticator Anda.',
      };
    }

    // Login normal (tanpa 2FA)
    return this.generateFullTokens(user);
  }

  // ==========================================
  // 3. FUNGSI GOOGLE OAUTH
  // ==========================================
  async validateGoogleUser(googleUser: { email: string; name: string }) {
    let user = await this.prisma.user.findUnique({ where: { email: googleUser.email } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          password: null,
          role: Role.VIEWER,
          isEmailVerified: true,
        },
      });
    }

    return this.generateFullTokens(user);
  }

  // ==========================================
  // 4. FUNGSI VERIFIKASI EMAIL
  // ==========================================
  async verifyEmail(token: string) {
    try {
      const payload = this.jwtService.verify(token);

      if (payload.purpose !== 'email_verification') {
        throw new BadRequestException('Token tidak valid untuk verifikasi email');
      }

      await this.prisma.user.update({
        where: { email: payload.email },
        data: { isEmailVerified: true },
      });

      return true;
    } catch (error) {
      throw new BadRequestException('Link verifikasi tidak valid atau sudah kedaluwarsa!');
    }
  }

  // ==========================================
  // 5. FUNGSI LUPA PASSWORD
  // ==========================================
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      return { message: 'Jika email terdaftar, link reset telah dikirim.' };
    }

    const resetToken = this.jwtService.sign(
      { email: user.email, purpose: 'reset_password' },
      { expiresIn: '15m' }
    );

    await this.emailService.sendResetPasswordEmail(user.email, resetToken);

    return { message: 'Jika email terdaftar, link reset telah dikirim.' };
  }

  // ==========================================
  // 6. FUNGSI RESET PASSWORD
  // ==========================================
  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(token);

      if (payload.purpose !== 'reset_password') {
        throw new BadRequestException('Token tidak valid untuk reset password');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await this.prisma.user.update({
        where: { email: payload.email },
        data: { password: hashedPassword },
      });

      return { message: 'Password berhasil diubah!' };
    } catch (error) {
      throw new BadRequestException('Link reset password tidak valid atau sudah kedaluwarsa!');
    }
  }

  // ==========================================
  // 7. FUNGSI TERIMA UNDANGAN TIM
  // ==========================================
  async acceptInvite(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(token);

      if (payload.purpose !== 'team_invite') {
        throw new BadRequestException('Token tidak valid untuk undangan tim.');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await this.prisma.user.update({
        where: { email: payload.email },
        data: {
          password: hashedPassword,
          isEmailVerified: true,
        },
      });

      return { message: 'Akun berhasil diaktifkan! Silakan login.' };
    } catch (error) {
      throw new BadRequestException('Token undangan tidak valid atau sudah kedaluwarsa.');
    }
  }

  // ==========================================
  // 8. REFRESH TOKEN — Perbarui access token tanpa login ulang
  // ==========================================
  async refreshToken(refreshToken: string) {
    // 1. Cari session yang punya refresh token ini
    const session = await this.prisma.userSession.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session) {
      throw new UnauthorizedException('Refresh token tidak valid.');
    }

    // 2. Cek apakah session sudah expired
    if (session.expiresAt < new Date()) {
      // Hapus session yang expired
      await this.prisma.userSession.delete({ where: { id: session.id } });
      throw new UnauthorizedException('Sesi telah berakhir. Silakan login kembali.');
    }

    // 3. Issue access token baru
    const user = session.user;
    const payload = { sub: user.id, email: user.email, role: user.role, name: user.name };
    const newAccessToken = this.jwtService.sign(payload);

    // 4. Rotate refresh token (opsional tapi lebih aman)
    const newRefreshToken = randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 hari

    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { refreshToken: newRefreshToken, expiresAt },
    });

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }

  // ==========================================
  // 9. LOGOUT — Hapus session dari DB
  // ==========================================
  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      // Hapus sesi spesifik
      await this.prisma.userSession.deleteMany({
        where: { userId, refreshToken },
      });
    } else {
      // Hapus SEMUA sesi user (logout dari semua device)
      await this.prisma.userSession.deleteMany({ where: { userId } });
    }

    return { message: 'Logout berhasil.' };
  }

  // ==========================================
  // 10. SETUP 2FA — Generate Secret & QR Code
  // ==========================================
  async enable2FA(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('User tidak ditemukan.');
    }

    if (user.isTwoFactorEnabled) {
      throw new BadRequestException('2FA sudah aktif untuk akun ini.');
    }

    // Generate secret TOTP baru
    const secret = speakeasy.generateSecret({
      name: `SARAI (${user.email})`,
      length: 20,
    });

    // Simpan secret (sementara) ke DB — belum aktif sampai diverifikasi
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });

    // Generate QR Code untuk di-scan oleh aplikasi Authenticator
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      message: 'Scan QR code di bawah ini dengan Google Authenticator atau Authy.',
      secret: secret.base32, // Untuk manual entry jika QR tidak bisa di-scan
      qrCode: qrCodeDataUrl,
    };
  }

  // ==========================================
  // 11. VERIFY & ACTIVATE 2FA
  // ==========================================
  async verify2FA(userId: string, totpCode: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('Setup 2FA belum dimulai. Panggil endpoint enable dulu.');
    }

    // Verifikasi kode TOTP yang dimasukkan user
    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: totpCode,
      window: 1, // Toleransi 30 detik (1 window)
    });

    if (!isValid) {
      throw new BadRequestException('Kode 2FA tidak valid atau sudah kedaluwarsa. Coba lagi.');
    }

    // Aktifkan 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: true },
    });

    return { message: '2FA berhasil diaktifkan! Akun Anda sekarang lebih aman.' };
  }

  // ==========================================
  // 12. LOGIN DENGAN 2FA
  // ==========================================
  async loginWith2FA(tempToken: string, totpCode: string) {
    // 1. Verifikasi temp token
    let payload: any;
    try {
      payload = this.jwtService.verify(tempToken);
    } catch {
      throw new UnauthorizedException('Sesi 2FA tidak valid atau sudah kedaluwarsa. Silakan login ulang.');
    }

    if (payload.purpose !== '2fa_verification') {
      throw new BadRequestException('Token tidak valid untuk verifikasi 2FA.');
    }

    // 2. Cari user dan validasi temp token di DB
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user || user.twoFactorTempToken !== tempToken) {
      throw new UnauthorizedException('Token 2FA tidak valid.');
    }

    // 3. Verifikasi kode TOTP
    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret!,
      encoding: 'base32',
      token: totpCode,
      window: 1,
    });

    if (!isValid) {
      throw new BadRequestException('Kode 2FA tidak valid atau sudah kedaluwarsa.');
    }

    // 4. Hapus temp token (one-time use)
    await this.prisma.user.update({
      where: { id: user.id },
      data: { twoFactorTempToken: null },
    });

    // 5. Issue full tokens
    return this.generateFullTokens(user);
  }

  // ==========================================
  // 13. DISABLE 2FA
  // ==========================================
  async disable2FA(userId: string, totpCode: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.isTwoFactorEnabled) {
      throw new BadRequestException('2FA tidak aktif pada akun ini.');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret!,
      encoding: 'base32',
      token: totpCode,
      window: 1,
    });

    if (!isValid) {
      throw new BadRequestException('Kode 2FA tidak valid. Verifikasi diperlukan untuk menonaktifkan 2FA.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isTwoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return { message: '2FA berhasil dinonaktifkan.' };
  }

  // ==========================================
  // HELPER: Generate access + refresh tokens
  // ==========================================
  private async generateFullTokens(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role, name: user.name };
    const accessToken = this.jwtService.sign(payload);

    // Buat refresh token (random string, bukan JWT)
    const refreshTokenStr = randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Refresh token berlaku 30 hari

    // Simpan refresh token ke DB (tabel UserSession)
    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        refreshToken: refreshTokenStr,
        expiresAt,
      },
    });

    const { password, twoFactorSecret, twoFactorTempToken, ...userWithoutSensitive } = user;

    return {
      message: 'Login berhasil!',
      access_token: accessToken,
      refresh_token: refreshTokenStr,
      user: userWithoutSensitive,
    };
  }
}