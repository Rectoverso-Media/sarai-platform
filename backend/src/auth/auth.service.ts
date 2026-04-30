import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client'; 
import { EmailService } from '../email/email.service';

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
}