import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  // ==========================================
  // 1. FUNGSI REGISTER
  // ==========================================
  async register(data: { name: string; email: string; password: string; role?: string }) {
    const existingUser = await this.prisma.teamMember.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new BadRequestException('Email sudah terdaftar bro!');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.teamMember.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role || 'Admin',
      },
    });

    // Solusi Error 1 & 3: Pakai teknik Destructuring untuk misahin password dari data user
    const { password, ...userWithoutPassword } = user;
    
    return { message: 'Registrasi sukses! Silakan Login.', user: userWithoutPassword };
  }

  // ==========================================
  // 2. FUNGSI LOGIN
  // ==========================================
  async login(data: { email: string; password: string }) {
    const user = await this.prisma.teamMember.findUnique({ where: { email: data.email } });
    
    // Solusi Error 2: Kita cek juga user.password biar bcrypt nggak nerima 'null'
    if (!user || !user.password) {
      throw new UnauthorizedException('Email atau Password salah!');
    }

    // Karena di atas udah dicek (!user.password), di sini TypeScript udah yakin passwordnya string
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau Password salah!');
    }

    const payload = { sub: user.id, email: user.email, role: user.role, name: user.name };
    const token = this.jwtService.sign(payload);

    // Solusi Error 1 & 3 lagi
    const { password, ...userWithoutPassword } = user;
    
    return {
      message: 'Login berhasil!',
      access_token: token,
      user: userWithoutPassword
    };
  }
}