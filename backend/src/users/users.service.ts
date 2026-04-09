import { Injectable } from '@nestjs/common';
// import { PrismaService } from '../prisma.service';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async create(data: { name: string; email: string }): Promise<User> {
    return this.prisma.user.create({ data });
  }
}
