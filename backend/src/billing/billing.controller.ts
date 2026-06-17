import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  Headers,
  HttpCode,
  Logger,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { BillingService } from './billing.service';
import { CreateCheckoutDto } from './dto/billing.dto';
import { PrismaService } from '../prisma/prisma.service';

@Controller('billing')
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(
    private readonly billingService: BillingService,
    private readonly prisma: PrismaService,
  ) {}

  // ──────────────────────────────────────────
  // GET /billing/subscription
  // Ambil status plan + usage saat ini
  // ──────────────────────────────────────────
  @Get('subscription')
  @UseGuards(AuthGuard('jwt'))
  async getSubscription(@Req() req: any) {
    const teamId = await this.getTeamIdFromUser(req.user.sub || req.user.id);
    return this.billingService.getSubscription(teamId);
  }

  // ──────────────────────────────────────────
  // POST /billing/checkout
  // Buat Stripe Checkout Session → return URL redirect
  // Body: { planName: 'PRO' | 'ENTERPRISE' }
  // ──────────────────────────────────────────
  @Post('checkout')
  @UseGuards(AuthGuard('jwt'))
  async createCheckoutSession(@Req() req: any, @Body() body: CreateCheckoutDto) {
    const userId = req.user.sub || req.user.id;
    const userEmail = req.user.email;
    const teamId = await this.getTeamIdFromUser(userId);
    return this.billingService.createCheckoutSession(teamId, body.planName, userEmail);
  }

  // ──────────────────────────────────────────
  // POST /billing/portal
  // Buka Stripe Customer Portal → return URL redirect
  // ──────────────────────────────────────────
  @Post('portal')
  @UseGuards(AuthGuard('jwt'))
  async createPortalSession(@Req() req: any) {
    const teamId = await this.getTeamIdFromUser(req.user.sub || req.user.id);
    return this.billingService.createPortalSession(teamId);
  }

  // ──────────────────────────────────────────
  // POST /billing/webhook
  // Stripe Webhook — TIDAK pakai JWT guard!
  // Stripe verifikasi via signature header.
  // PENTING: endpoint ini butuh raw body (set di main.ts)
  // ──────────────────────────────────────────
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      this.logger.error('rawBody tidak tersedia — pastikan rawBody: true di NestFactory.create()');
      throw new Error('rawBody tidak tersedia');
    }
    return this.billingService.handleWebhook(rawBody, signature);
  }

  // ──────────────────────────────────────────
  // GET /billing/quota-status
  // Cek status quota saat ini (untuk header banner)
  // ──────────────────────────────────────────
  @Get('quota-status')
  @UseGuards(AuthGuard('jwt'))
  async getQuotaStatus(@Req() req: any) {
    const teamId = await this.getTeamIdFromUser(req.user.sub || req.user.id);
    const [queries, aiTokens, airbyteSyncs] = await Promise.all([
      this.billingService.checkQuota(teamId, 'queries'),
      this.billingService.checkQuota(teamId, 'aiTokens'),
      this.billingService.checkQuota(teamId, 'airbyteSyncs'),
    ]);
    return { queries, aiTokens, airbyteSyncs };
  }

  // ──────────────────────────────────────────
  // PRIVATE HELPER
  // ──────────────────────────────────────────
  private async getTeamIdFromUser(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { teamId: true },
    });

    if (!user?.teamId) {
      // Kalau user belum punya tim, buat tim default otomatis
      const team = await this.prisma.team.create({
        data: {
          name: 'My Team',
          subscriptionPlan: 'FREE',
          subscriptionStatus: 'ACTIVE',
          legacyUsers: { connect: { id: userId } },
        },
      });
      await this.prisma.user.update({
        where: { id: userId },
        data: { teamId: team.id },
      });
      return team.id;
    }

    return user.teamId;
  }
}
