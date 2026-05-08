import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client'; 
import { EmailService } from '../email/email.service';
// import { BadRequestException } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService
  ) {}

  // 1. FUNGSI REGISTER
  async register(data: { name: string; email: string; password: string; role?: Role }) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new BadRequestException('Email sudah terdaftar bro!');
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
    

    

    // Destructuring untuk misahin password dari data user yang dikembalikan
    const { password, ...userWithoutPassword } = user;
    
    return { message: 'Registrasi sukses! Silakan Login.', user: userWithoutPassword };
  }

  // 2. FUNGSI LOGIN
  async login(data: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: data.email } });
    
    if (!user || !user.password) {
      throw new UnauthorizedException('Email atau Password salah!');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau Password salah!');
    }

    const payload = { sub: user.id, email: user.email, role: user.role, name: user.name };
    const token = this.jwtService.sign(payload);

    const { password, ...userWithoutPassword } = user;
    
    return {
      message: 'Login berhasil!',
      access_token: token,
      user: userWithoutPassword
    };
  }

  // 3. FUNGSI GOOGLE OAUTH
  async validateGoogleUser(googleUser: { email: string; name: string }) {
    let user = await this.prisma.user.findUnique({ where: { email: googleUser.email } });

    if (!user) {
      // Kalau belum pernah daftar, otomatis bikinkan akunnya
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          password: null, // Sengaja null karena login pakai Google
          role: Role.VIEWER, // Role default
          isEmailVerified: true, // Otomatis verified karena dari Google
        },
      });
    }

    // Buatkan Token KTP Digital seperti login biasa
    const payload = { sub: user.id, email: user.email, role: user.role, name: user.name };
    const token = this.jwtService.sign(payload);

    const { password, ...userWithoutPassword } = user;

    return {
      access_token: token,
      user: userWithoutPassword,
    };
  }

  // ==========================================
  // 4. FUNGSI VERIFIKASI EMAIL DARI LINK
  // ==========================================
  async verifyEmail(token: string) {
    try {
      // Cek apakah tokennya asli dan belum expired
      const payload = this.jwtService.verify(token);

      if (payload.purpose !== 'email_verification') {
        throw new BadRequestException('Token tidak valid untuk verifikasi email');
      }

      // Update status user di database
      await this.prisma.user.update({
        where: { email: payload.email },
        data: { isEmailVerified: true },
      });

      return true;
    } catch (error) {
      throw new BadRequestException('Link verifikasi tidak valid atau sudah kedaluwarsa!');
    }
  }

  // 5. FUNGSI LUPA PASSWORD
  async forgotPassword(email: string) {
    // 1. Cek apakah emailnya terdaftar
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    // Kalau nggak ada, tetep balikin sukses biar hacker nggak bisa nebak email mana aja yang terdaftar
    if (!user) {
      return { message: 'Jika email terdaftar, link reset telah dikirim.' };
    }

    // 2. Buat token khusus reset (umur pendek, cuma 15 menit)
    const resetToken = this.jwtService.sign(
      { email: user.email, purpose: 'reset_password' }, 
      { expiresIn: '15m' }
    );

    // 3. Suruh kurir ngirim email
    await this.emailService.sendResetPasswordEmail(user.email, resetToken);

    return { message: 'Jika email terdaftar, link reset telah dikirim.' };
  }

  // ==========================================
  // 6. FUNGSI EKSEKUSI RESET PASSWORD
  // ==========================================
  async resetPassword(token: string, newPassword: string) {
    try {
      // 1. Validasi token dari email
      const payload = this.jwtService.verify(token);
      
      if (payload.purpose !== 'reset_password') {
        throw new BadRequestException('Token tidak valid untuk reset password');
      }

      // 2. Hash password baru biar aman di database
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // 3. Timpa password lama di database
      await this.prisma.user.update({
        where: { email: payload.email },
        data: { password: hashedPassword },
      });

      return { message: 'Password berhasil diubah!' };
    } catch (error) {
      throw new BadRequestException('Link reset password tidak valid atau sudah kedaluwarsa!');
    }
  }

  async acceptInvite(token: string, newPassword: string) {
    try {
      // 1. Bongkar dan verifikasi KTP (Token) undangannya
      const payload = this.jwtService.verify(token);
      
      // 2. Pastikan ini token undangan, bukan token login
      if (payload.purpose !== 'team_invite') {
        throw new BadRequestException('Token tidak valid untuk undangan tim.');
      }

      // 3. Hash password baru yang diinput user
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // 4. Update data user di database
      await this.prisma.user.update({
        where: { email: payload.email },
        data: {
          password: hashedPassword,
          isEmailVerified: true, // Mengubah status Pending menjadi Active!
        },
      });

      return { message: 'Akun berhasil diaktifkan! Silakan login.' };
    } catch (error) {
      throw new BadRequestException('Token undangan tidak valid atau sudah kedaluwarsa.');
    }
  }

}