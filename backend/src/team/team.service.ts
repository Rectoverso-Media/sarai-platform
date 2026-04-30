import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  // 1. Ambil semua anggota tim
  async getAllMembers() {
    const members = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isEmailVerified: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    // Modifikasi data biar formatnya pas sama tabel Frontend kamu
    return members.map(m => ({
      ...m,
      status: m.isEmailVerified ? 'Active' : 'Pending'
    }));
  }

  // 2. Tambah anggota tim baru
  async addMember(data: { name: string; email: string; role: string }) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new BadRequestException('Email sudah terdaftar di tim!');
    }

    // Password default untuk member yang di-invite
    const hashedPassword = await bcrypt.hash('Sarai123!', 10);

    // Validasi Role (Ubah string ke Enum)
    const validRole = (Object.values(Role) as string[]).includes(data.role.toUpperCase()) 
      ? (data.role.toUpperCase() as Role) 
      : Role.VIEWER;

    const newMember = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: validRole,
        isEmailVerified: false, // Default pending sampai dia login/verifikasi
      },
    });

    return { message: 'Berhasil mengundang anggota baru!', member: newMember };
  }
}