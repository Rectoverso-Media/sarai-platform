import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiGateway } from './ai.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    // JwtModule diperlukan oleh AiGateway untuk verifikasi token saat handshake
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  controllers: [AiController],
  providers: [AiService, AiGateway],
})
export class AiModule {}