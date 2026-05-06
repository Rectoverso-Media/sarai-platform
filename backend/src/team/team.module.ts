import { Module } from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { PrismaModule } from '../prisma/prisma.module';
// improt { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module'; 
import { JwtModule } from '@nestjs/jwt'; 

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    JwtModule.register({
      secret: 'SARAI_RAHASIA_SUPER_AMAN_123!',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [TeamService],
  controllers: [TeamController]
})
export class TeamModule {}
