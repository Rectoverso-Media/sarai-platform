import { Module } from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { AuthModule } from '../auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    PassportModule,
    AuthModule,
    // JWT untuk generate invite token
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'SARAI_RAHASIA_SUPER_AMAN_123!',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [TeamService],
  controllers: [TeamController],
})
export class TeamModule {}
