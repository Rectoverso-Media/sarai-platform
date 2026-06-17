import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';

// Stripe di-mock sepenuhnya
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn().mockResolvedValue({ id: 'cus_mock123' }),
    },
    prices: {
      list: jest.fn().mockResolvedValue({ data: [{ id: 'price_mock123' }] }),
    },
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test', id: 'cs_mock123' }),
      },
    },
    billingPortal: {
      sessions: {
        create: jest.fn().mockResolvedValue({ url: 'https://billing.stripe.com/portal/test' }),
      },
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
    subscriptions: {
      retrieve: jest.fn().mockResolvedValue({ current_period_end: Math.floor(Date.now() / 1000) + 86400 }),
    },
  }));
});

const mockPrismaService = {
  team: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findFirst: jest.fn(),
  },
  usageMetric: {
    create: jest.fn(),
  },
};

const mockEmailService = {
  sendBillingEmail: jest.fn().mockResolvedValue(undefined),
};

describe('BillingService', () => {
  let service: BillingService;

  beforeEach(async () => {
    // Set env vars yang dibutuhkan BillingService
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
    process.env.STRIPE_PRODUCT_PRO = 'prod_mock_pro';
    process.env.STRIPE_PRODUCT_ENTERPRISE = 'prod_mock_enterprise';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock_secret';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getSubscription() ────────────────────────────────────────────────────

  describe('getSubscription()', () => {
    it('should throw NotFoundException jika team tidak ditemukan', async () => {
      mockPrismaService.team.findUnique.mockResolvedValue(null);

      await expect(service.getSubscription('non-existent-team')).rejects.toThrow(NotFoundException);
    });

    it('should return subscription info dengan usage & limits untuk FREE plan', async () => {
      mockPrismaService.team.findUnique.mockResolvedValue({
        id: 'team-1',
        name: 'Test Team',
        subscriptionPlan: 'FREE',
        subscriptionStatus: 'ACTIVE',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        trialEndsAt: null,
        currentPeriodEnd: null,
        aiTokensUsed: 500,
        queriesUsed: 100,
        storageUsedMB: 50,
        airbyteSyncsUsed: 2,
      });

      const result = await service.getSubscription('team-1');

      expect(result.subscription.plan).toBe('FREE');
      expect(result.usage.queries.used).toBe(100);
      expect(result.usage.aiTokens.limit).toBe(10000); // default FREE limit
    });

    it('should menandai isTrialExpired=true jika trialEndsAt sudah lewat', async () => {
      const yesterday = new Date(Date.now() - 86400000);
      mockPrismaService.team.findUnique.mockResolvedValue({
        id: 'team-1',
        name: 'Test Team',
        subscriptionPlan: 'FREE',
        subscriptionStatus: 'ACTIVE',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        trialEndsAt: yesterday,
        currentPeriodEnd: null,
        aiTokensUsed: 0,
        queriesUsed: 0,
        storageUsedMB: 0,
        airbyteSyncsUsed: 0,
      });

      const result = await service.getSubscription('team-1');

      expect(result.subscription.isTrialExpired).toBe(true);
      expect(result.subscription.status).toBe('TRIAL_EXPIRED');
    });
  });

  // ─── checkQuota() ─────────────────────────────────────────────────────────

  describe('checkQuota()', () => {
    it('should return allowed=false jika quota habis', async () => {
      mockPrismaService.team.findUnique.mockResolvedValue({
        subscriptionPlan: 'FREE',
        queriesUsed: 1000, // sudah di limit (FREE = 1000)
        aiTokensUsed: 0,
        airbyteSyncsUsed: 0,
      });

      const result = await service.checkQuota('team-1', 'queries');

      expect(result.allowed).toBe(false);
      expect(result.percentage).toBe(100);
    });

    it('should return allowed=true jika kuota Enterprise (unlimited)', async () => {
      mockPrismaService.team.findUnique.mockResolvedValue({
        subscriptionPlan: 'ENTERPRISE',
        queriesUsed: 9999999,
        aiTokensUsed: 0,
        airbyteSyncsUsed: 0,
      });

      const result = await service.checkQuota('team-1', 'queries');

      expect(result.allowed).toBe(true);
      expect(result.isUnlimited ?? true).toBe(true);
    });

    it('should return isWarning=true jika penggunaan > 80%', async () => {
      mockPrismaService.team.findUnique.mockResolvedValue({
        subscriptionPlan: 'FREE',
        queriesUsed: 900, // 90% dari 1000
        aiTokensUsed: 0,
        airbyteSyncsUsed: 0,
      });

      const result = await service.checkQuota('team-1', 'queries');

      expect(result.isWarning).toBe(true);
      expect(result.percentage).toBeGreaterThanOrEqual(80);
    });
  });

  // ─── incrementUsage() ─────────────────────────────────────────────────────

  describe('incrementUsage()', () => {
    it('should increment queriesUsed counter', async () => {
      mockPrismaService.team.update.mockResolvedValue({});
      mockPrismaService.usageMetric.create.mockResolvedValue({});

      await service.incrementUsage('team-1', 'QUERY', 1);

      expect(mockPrismaService.team.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { queriesUsed: { increment: 1 } },
        }),
      );
      expect(mockPrismaService.usageMetric.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ metricType: 'QUERY', value: 1 }) }),
      );
    });

    it('should increment aiTokensUsed dengan value yang diberikan', async () => {
      mockPrismaService.team.update.mockResolvedValue({});
      mockPrismaService.usageMetric.create.mockResolvedValue({});

      await service.incrementUsage('team-1', 'AI_TOKEN', 500);

      expect(mockPrismaService.team.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { aiTokensUsed: { increment: 500 } } }),
      );
    });
  });

  // ─── resetMonthlyUsage() ──────────────────────────────────────────────────

  describe('resetMonthlyUsage()', () => {
    it('should reset semua usage counter ke 0', async () => {
      mockPrismaService.team.update.mockResolvedValue({});

      const result = await service.resetMonthlyUsage('team-1');

      expect(result.message).toContain('team-1');
      expect(mockPrismaService.team.update).toHaveBeenCalledWith({
        where: { id: 'team-1' },
        data: { queriesUsed: 0, aiTokensUsed: 0, airbyteSyncsUsed: 0 },
      });
    });
  });

  // ─── Static methods ───────────────────────────────────────────────────────

  describe('BillingService.getQuotaLimits()', () => {
    it('should return quota limits untuk semua plan', () => {
      const limits = BillingService.getQuotaLimits();

      expect(limits).toHaveProperty('FREE');
      expect(limits).toHaveProperty('PRO');
      expect(limits).toHaveProperty('ENTERPRISE');
      expect(limits.FREE.queries).toBeGreaterThan(0);
      expect(limits.PRO.queries).toBeGreaterThan(limits.FREE.queries);
      expect(limits.ENTERPRISE.queries).toBe(-1); // unlimited
    });
  });
});
