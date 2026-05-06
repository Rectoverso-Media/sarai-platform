import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class TeamService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService, 
    private jwtService: JwtService      
  ) {}

  // 1. Ambil semua anggota (Filter HANYA di tim yang sama)
  async getAllMembers(teamId: string) {
    if (!teamId) return []; // Kalau dia belum punya tim, balikin array kosong

    const members = await this.prisma.user.findMany({
      where: { teamId: teamId }, // ambil teman se-tim
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isEmailVerified: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return members.map(m => ({
      ...m,
      status: m.isEmailVerified ? 'Active' : 'Pending'
    }));
  }

  // 2. Tambah anggota & Kirim Email Undangan
  async addMember(inviterId: string, data: { name: string; email: string; role: string }) {
    // a. Cek pengundang ada di tim mana
    const inviter = await this.prisma.user.findUnique({
      where: { id: inviterId },
      include: { team: true },
    });

    if (!inviter || !inviter.teamId) {
      throw new BadRequestException('Kamu belum memiliki/tergabung dalam tim!');
    }

    // b. Validasi email & role (Kodingan asli kamu)
    const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new BadRequestException('Email sudah terdaftar di sistem!');
    }

    const hashedPassword = await bcrypt.hash('Sarai123!', 10);
    const validRole = (Object.values(Role) as string[]).includes(data.role.toUpperCase()) 
      ? (data.role.toUpperCase() as Role) 
      : Role.VIEWER;

    // c. Bikin User baru di DB dan MASUKKAN KE TIM
    const newMember = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: validRole,
        teamId: inviter.teamId, //  Hubungkan ke tim si pengundang
        isEmailVerified: false,
      },
    });

    // d. Generate Token untuk Link Email
    const inviteToken = this.jwtService.sign({
      email: data.email,
      purpose: 'team_invite',
    });

    // e. Kirim Email Undangan
    await this.emailService.sendTeamInviteEmail(
      data.email,
      inviter.name,
      inviter.team?.name || 'Tim Kamu', 
      inviteToken
    );

    return { message: 'Berhasil mengundang anggota baru & email terkirim!', member: newMember };
  }
}