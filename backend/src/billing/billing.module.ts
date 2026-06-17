import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService], // Export agar bisa dipakai oleh module lain (QuotaGuard, dll)
})
export class BillingModule {}
