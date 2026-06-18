import {
  Controller, Get, Post, Body, Req, UseGuards, Headers, HttpCode, Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { BillingService } from './billing.service';
import { CreateCheckoutDto } from './dto/billing.dto';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(
    private readonly billingService: BillingService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('subscription')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Ambil status subscription dan usage saat ini' })
  @ApiResponse({ status: 200, description: 'Info subscription berhasil diambil' })
  async getSubscription(@Req() req: any) {
    const teamId = await this.getTeamIdFromUser(req.user.sub || req.user.id);
    return this.billingService.getSubscription(teamId);
  }

  @Post('checkout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buat Stripe Checkout Session untuk upgrade plan' })
  @ApiResponse({ status: 201, description: 'Checkout session URL berhasil dibuat' })
  async createCheckoutSession(@Req() req: any, @Body() body: CreateCheckoutDto) {
    const userId = req.user.sub || req.user.id;
    const userEmail = req.user.email;
    const teamId = await this.getTeamIdFromUser(userId);
    return this.billingService.createCheckoutSession(teamId, body.planName, userEmail);
  }

  @Post('portal')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buka Stripe Customer Portal untuk manage subscription' })
  @ApiResponse({ status: 200, description: 'Portal URL berhasil dibuat' })
  async createPortalSession(@Req() req: any) {
    const teamId = await this.getTeamIdFromUser(req.user.sub || req.user.id);
    return this.billingService.createPortalSession(teamId);
  }

  @Post('webhook')
  @HttpCode(200)
  @ApiExcludeEndpoint()
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

  @Get('quota-status')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cek status quota saat ini (queries, AI tokens, syncs)' })
  @ApiResponse({ status: 200, description: 'Status quota berhasil diambil' })
  async getQuotaStatus(@Req() req: any) {
    const teamId = await this.getTeamIdFromUser(req.user.sub || req.user.id);
    const [queries, aiTokens, airbyteSyncs] = await Promise.all([
      this.billingService.checkQuota(teamId, 'queries'),
      this.billingService.checkQuota(teamId, 'aiTokens'),
      this.billingService.checkQuota(teamId, 'airbyteSyncs'),
    ]);
    return { queries, aiTokens, airbyteSyncs };
  }

  private async getTeamIdFromUser(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { teamId: true },
    });

    if (!user?.teamId) {
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
