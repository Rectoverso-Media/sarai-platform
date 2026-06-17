import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

// =============================================
// QUOTA LIMITS PER PLAN
// -1 = unlimited (Enterprise)
// =============================================
const QUOTA_LIMITS: Record<string, Record<string, number>> = {
  FREE: {
    queries: parseInt(process.env.QUOTA_FREE_QUERIES || '1000'),
    aiTokens: parseInt(process.env.QUOTA_FREE_AI_TOKENS || '10000'),
    storageMB: parseInt(process.env.QUOTA_FREE_STORAGE_MB || '500'),
    airbyteSyncs: parseInt(process.env.QUOTA_FREE_AIRBYTE_SYNCS || '5'),
  },
  PRO: {
    queries: parseInt(process.env.QUOTA_PRO_QUERIES || '50000'),
    aiTokens: parseInt(process.env.QUOTA_PRO_AI_TOKENS || '500000'),
    storageMB: parseInt(process.env.QUOTA_PRO_STORAGE_MB || '10240'),
    airbyteSyncs: parseInt(process.env.QUOTA_PRO_AIRBYTE_SYNCS || '100'),
  },
  ENTERPRISE: {
    queries: -1,
    aiTokens: -1,
    storageMB: -1,
    airbyteSyncs: -1,
  },
};

const PLAN_NAMES: Record<string, string> = {
  FREE: 'Free Plan',
  PRO: 'Pro Plan',
  ENTERPRISE: 'Enterprise Plan',
};

@Injectable()
export class BillingService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY tidak dikonfigurasi di environment variables');
    }
    // stripe v16 menggunakan API version 2024-06-20
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });
  }

  // =============================================
  // 1. AMBIL SUBSCRIPTION + USAGE SAAT INI
  // =============================================
  async getSubscription(teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        name: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        trialEndsAt: true,
        currentPeriodEnd: true,
        aiTokensUsed: true,
        queriesUsed: true,
        storageUsedMB: true,
        airbyteSyncsUsed: true,
      },
    });

    if (!team) {
      throw new NotFoundException('Tim tidak ditemukan');
    }

    const plan = team.subscriptionPlan || 'FREE';
    const limits = QUOTA_LIMITS[plan] ?? QUOTA_LIMITS['FREE'];

    const isTrialExpired =
      team.trialEndsAt != null && new Date() > team.trialEndsAt;

    return {
      team: {
        id: team.id,
        name: team.name,
      },
      subscription: {
        plan: plan,
        planDisplayName: PLAN_NAMES[plan] ?? plan,
        status: isTrialExpired ? 'TRIAL_EXPIRED' : (team.subscriptionStatus || 'INACTIVE'),
        stripeSubscriptionId: team.stripeSubscriptionId,
        trialEndsAt: team.trialEndsAt,
        currentPeriodEnd: team.currentPeriodEnd,
        isTrialExpired,
        daysUntilTrialEnd: team.trialEndsAt
          ? Math.max(0, Math.ceil((team.trialEndsAt.getTime() - Date.now()) / 86400000))
          : null,
      },
      usage: {
        queries: {
          used: team.queriesUsed,
          limit: limits.queries,
          percentage: limits.queries === -1 ? 0 : Math.round((team.queriesUsed / limits.queries) * 100),
          isUnlimited: limits.queries === -1,
        },
        aiTokens: {
          used: team.aiTokensUsed,
          limit: limits.aiTokens,
          percentage: limits.aiTokens === -1 ? 0 : Math.round((team.aiTokensUsed / limits.aiTokens) * 100),
          isUnlimited: limits.aiTokens === -1,
        },
        storageMB: {
          used: team.storageUsedMB,
          limit: limits.storageMB,
          percentage: limits.storageMB === -1 ? 0 : Math.round((team.storageUsedMB / limits.storageMB) * 100),
          isUnlimited: limits.storageMB === -1,
        },
        airbyteSyncs: {
          used: team.airbyteSyncsUsed,
          limit: limits.airbyteSyncs,
          percentage: limits.airbyteSyncs === -1 ? 0 : Math.round((team.airbyteSyncsUsed / limits.airbyteSyncs) * 100),
          isUnlimited: limits.airbyteSyncs === -1,
        },
      },
      limits,
    };
  }

  // =============================================
  // 2. BUAT STRIPE CHECKOUT SESSION
  // =============================================
  async createCheckoutSession(teamId: string, planName: 'PRO' | 'ENTERPRISE', userEmail: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Tim tidak ditemukan');

    let customerId = team.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: userEmail,
        name: team.name,
        metadata: { teamId },
      });
      customerId = customer.id;
      await this.prisma.team.update({
        where: { id: teamId },
        data: { stripeCustomerId: customerId },
      });
    }

    const productId = planName === 'PRO'
      ? process.env.STRIPE_PRODUCT_PRO
      : process.env.STRIPE_PRODUCT_ENTERPRISE;

    if (!productId) {
      throw new BadRequestException(`Product ID untuk plan ${planName} belum dikonfigurasi di .env`);
    }

    const prices = await this.stripe.prices.list({
      product: productId,
      active: true,
      limit: 1,
    });

    if (!prices.data.length) {
      throw new BadRequestException(
        `Tidak ada harga aktif untuk produk ${planName}. Tambahkan harga di Stripe Dashboard.`
      );
    }

    const priceId = prices.data[0].id;

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?tab=billing&checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?tab=billing&checkout=cancelled`,
      subscription_data: {
        metadata: { teamId, planName },
      },
      metadata: { teamId, planName },
    });

    this.logger.log(`Checkout session dibuat untuk team ${teamId}, plan ${planName}: ${session.id}`);
    return { url: session.url, sessionId: session.id };
  }

  // =============================================
  // 3. BUAT STRIPE CUSTOMER PORTAL SESSION
  // =============================================
  async createPortalSession(teamId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Tim tidak ditemukan');

    if (!team.stripeCustomerId) {
      throw new BadRequestException(
        'Akun belum memiliki subscription aktif. Lakukan upgrade terlebih dahulu.'
      );
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: team.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?tab=billing`,
    });

    this.logger.log(`Customer portal session dibuat untuk team ${teamId}`);
    return { url: session.url };
  }

  // =============================================
  // 4. HANDLE STRIPE WEBHOOK EVENTS
  // =============================================
  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret || webhookSecret.includes('GANTI_DENGAN')) {
      throw new InternalServerErrorException('STRIPE_WEBHOOK_SECRET belum dikonfigurasi. Jalankan: stripe listen --forward-to localhost:3001/billing/webhook');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      this.logger.error(`Webhook signature verification gagal: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    this.logger.log(`Stripe webhook event diterima: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        this.logger.log(`Unhandled Stripe event: ${event.type}`);
    }

    return { received: true, eventType: event.type };
  }

  // =============================================
  // 5. CHECK QUOTA
  // =============================================
  async checkQuota(
    teamId: string,
    metricType: 'queries' | 'aiTokens' | 'airbyteSyncs',
  ): Promise<{ allowed: boolean; used: number; limit: number; plan: string; percentage: number; isWarning: boolean }> {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      select: {
        subscriptionPlan: true,
        queriesUsed: true,
        aiTokensUsed: true,
        airbyteSyncsUsed: true,
      },
    });

    if (!team) throw new NotFoundException('Tim tidak ditemukan');

    const plan = team.subscriptionPlan || 'FREE';
    const limits = QUOTA_LIMITS[plan] ?? QUOTA_LIMITS['FREE'];
    const limit = limits[metricType] ?? 0;

    const usageMap: Record<string, number> = {
      queries: team.queriesUsed,
      aiTokens: team.aiTokensUsed,
      airbyteSyncs: team.airbyteSyncsUsed,
    };
    const used = usageMap[metricType] ?? 0;

    if (limit === -1) {
      return { allowed: true, used, limit, plan, percentage: 0, isWarning: false };
    }

    const percentage = Math.round((used / limit) * 100);
    return { allowed: used < limit, used, limit, plan, percentage, isWarning: percentage >= 80 };
  }

  // =============================================
  // 6. INCREMENT USAGE COUNTER
  // =============================================
  async incrementUsage(teamId: string, metricType: 'QUERY' | 'AI_TOKEN' | 'AIRBYTE_SYNC', value = 1) {
    const updateData: Record<string, any> = {};
    if (metricType === 'QUERY') updateData.queriesUsed = { increment: value };
    else if (metricType === 'AI_TOKEN') updateData.aiTokensUsed = { increment: value };
    else if (metricType === 'AIRBYTE_SYNC') updateData.airbyteSyncsUsed = { increment: value };

    await Promise.all([
      this.prisma.team.update({ where: { id: teamId }, data: updateData }),
      this.prisma.usageMetric.create({ data: { teamId, metricType, value } }),
    ]);
  }

  // =============================================
  // 7. RESET MONTHLY USAGE
  // =============================================
  async resetMonthlyUsage(teamId: string) {
    await this.prisma.team.update({
      where: { id: teamId },
      data: { queriesUsed: 0, aiTokensUsed: 0, airbyteSyncsUsed: 0 },
    });
    return { message: `Usage untuk team ${teamId} berhasil direset.` };
  }

  // =============================================
  // PRIVATE WEBHOOK HANDLERS
  // =============================================

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const teamId = session.metadata?.teamId;
    const planName = session.metadata?.planName;
    if (!teamId || !planName) {
      this.logger.warn('Checkout completed tanpa metadata teamId/planName');
      return;
    }

    let periodEnd: Date | null = null;
    if (session.subscription) {
      const sub = await this.stripe.subscriptions.retrieve(session.subscription as string);
      periodEnd = new Date(sub.current_period_end * 1000);
    }

    await this.prisma.team.update({
      where: { id: teamId },
      data: {
        subscriptionPlan: planName.toUpperCase(),
        subscriptionStatus: 'ACTIVE',
        stripeSubscriptionId: session.subscription as string,
        currentPeriodEnd: periodEnd,
      },
    });

    this.logger.log(`✅ Team ${teamId} upgrade ke ${planName}`);
  }

  private async handleSubscriptionUpdated(sub: Stripe.Subscription) {
    const teamId = sub.metadata?.teamId;
    if (!teamId) return;

    const planName = sub.metadata?.planName || 'FREE';
    await this.prisma.team.update({
      where: { id: teamId },
      data: {
        subscriptionPlan: planName.toUpperCase(),
        subscriptionStatus: sub.status.toUpperCase(),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
      },
    });

    this.logger.log(`🔄 Team ${teamId} subscription updated: ${sub.status} / ${planName}`);
  }

  private async handleSubscriptionDeleted(sub: Stripe.Subscription) {
    const teamId = sub.metadata?.teamId;
    if (!teamId) return;

    await this.prisma.team.update({
      where: { id: teamId },
      data: {
        subscriptionPlan: 'FREE',
        subscriptionStatus: 'CANCELED',
        stripeSubscriptionId: null,
        currentPeriodEnd: null,
      },
    });

    try {
      const owner = await this.prisma.user.findFirst({ where: { teamId, role: 'OWNER' } });
      if (owner?.email) {
        await this.emailService.sendBillingEmail(owner.email, 'subscription_canceled', { teamName: owner.name });
      }
    } catch (e) {
      this.logger.error('Gagal kirim email cancellation:', e);
    }

    this.logger.log(`❌ Team ${teamId} subscription canceled → FREE`);
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer as any)?.id;
    if (!customerId) return;

    const team = await this.prisma.team.findFirst({ where: { stripeCustomerId: customerId } });
    if (!team) return;

    await this.prisma.team.update({
      where: { id: team.id },
      data: { queriesUsed: 0, aiTokensUsed: 0, airbyteSyncsUsed: 0, subscriptionStatus: 'ACTIVE' },
    });

    this.logger.log(`💰 Payment succeeded team ${team.id} — counter direset`);
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer as any)?.id;
    if (!customerId) return;

    const team = await this.prisma.team.findFirst({
      where: { stripeCustomerId: customerId },
      include: { legacyUsers: { where: { role: 'OWNER' }, take: 1 } },
    });
    if (!team) return;

    await this.prisma.team.update({ where: { id: team.id }, data: { subscriptionStatus: 'PAST_DUE' } });

    const ownerEmail = team.legacyUsers?.[0]?.email;
    if (ownerEmail) {
      try {
        await this.emailService.sendBillingEmail(ownerEmail, 'payment_failed', { teamName: team.name });
      } catch (e) {
        this.logger.error('Gagal kirim email payment failed:', e);
      }
    }

    this.logger.warn(`⚠️ Payment FAILED team ${team.id} → PAST_DUE`);
  }

  static getQuotaLimits() {
    return QUOTA_LIMITS;
  }
}
