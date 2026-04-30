import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from './google.strategy';


@Module({
  imports: [
    PrismaModule,
    PassportModule,
    // Konfigurasi Token KTP Digital (JWT)
    JwtModule.register({
      secret: 'SARAI_RAHASIA_SUPER_AMAN_123!', // Aslinya ini wajib ditaruh di file .env
      signOptions: { expiresIn: '1d' }, // Token berlaku 1 hari
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy],
})
export class AuthModule {}