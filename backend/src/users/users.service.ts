import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  // --- FUNGSI REGISTER ---
  async create(data: { name: string; email: string; password: string }): Promise<User> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
    });
  }

  // --- FUNGSI LOGIN BARU ---
  async login(data: { email: string; password: string }) {
    // Cari user di database berdasarkan email
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    // Kalau emailnya nggak ketemu
    if (!user) {
      throw new UnauthorizedException('Email tidak terdaftar!');
    }

    // Cocokkan password ketikan user dengan password alien di database
    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    // Kalau passwordnya salah
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password salah!');
    }

    // Kalau sukses! (Kita balikin datanya, tapi passwordnya JANGAN ikut dikirim)
    return {
      message: 'Login Berhasil!',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    };
  }
}