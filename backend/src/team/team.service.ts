import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.teamMember.findMany({
      orderBy: { createdAt: 'asc' }
    });
  }

  async create(data: { name: string; email: string; role: string }) {
    return this.prisma.teamMember.create({
      data: {
        ...data,
        status: 'Active',
      },
    });
  }

  async remove(id: string) {
    return this.prisma.teamMember.delete({
      where: { id },
    });
  }
}