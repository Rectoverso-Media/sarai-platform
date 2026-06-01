import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  // FUNGSI REGISTER
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

  // FUNGSI LOGIN BARU
  async login(data: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email tidak terdaftar!');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password as string);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Password salah!');
    }

    return {
      message: 'Login Berhasil!',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    };
  }

  // FUNGSI UPDATE PROFIL (BARU)
  async updateProfile(userId: string, updateData: { name?: string; password?: string }) {
    // 1. Cek apakah user ada di database
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User tidak ditemukan!');

    const dataToUpdate: any = {};

    // 2. Jika ada nama baru, masukkan ke objek update
    if (updateData.name) {
      dataToUpdate.name = updateData.name;
    }

    // 3. Jika ada password baru, enkripsi dulu!
    if (updateData.password) {
      const saltRounds = 10;
      dataToUpdate.password = await bcrypt.hash(updateData.password, saltRounds);
    }

    // 4. Update data di database
    return this.prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      // HANYA KEMBALIKAN DATA AMAN (Jangan return password)
      select: { id: true, name: true, email: true } 
    });
  }
}