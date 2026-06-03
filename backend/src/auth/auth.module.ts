import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from './google.strategy';
import { EmailModule } from '../email/email.module';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    EmailModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'SARAI_RAHASIA_SUPER_AMAN_123!',
      signOptions: { expiresIn: '1d' }, // Access token berlaku 1 hari
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, JwtStrategy, RolesGuard],
  exports: [AuthService, JwtModule, RolesGuard], // Export agar modul lain bisa pakai
})
export class AuthModule {}