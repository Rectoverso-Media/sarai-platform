import { Module } from '@nestjs/common';
import { InfrastructureService } from './infrastructure.service';
import { InfrastructureController } from './infrastructure.controller';
// Pastikan baris import PrismaModule ini ada:
import { PrismaModule } from '../prisma/prisma.module'; 

@Module({
  // Pastikan PrismaModule masuk ke dalam array imports ini:
  imports: [PrismaModule], 
  controllers: [InfrastructureController],
  providers: [InfrastructureService],
})
export class InfrastructureModule {}