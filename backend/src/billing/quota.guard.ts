import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';

// ─── Decorator helper ─────────────────────────────────────────────────────────
export const QUOTA_TYPE_KEY = 'quotaType';

/**
 * @UseQuota('queries') — attach ke endpoint untuk enforce quota sebelum eksekusi
 * Quota types:
 *   'queries'      — counter untuk eksekusi query
 *   'aiTokens'     — counter untuk AI token usage
 *   'airbyteSyncs' — counter untuk Airbyte sync jobs
 */
export function UseQuota(quotaType: 'queries' | 'aiTokens' | 'airbyteSyncs'): MethodDecorator {
  return (target: any, key: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(QUOTA_TYPE_KEY, quotaType, descriptor.value);
    return descriptor;
  };
}

// ─── Quota Limits (sinkron dengan billing.service.ts) ─────────────────────────
const QUOTA_LIMITS: Record<string, Record<string, number>> = {
  FREE: {
    queries: parseInt(process.env.QUOTA_FREE_QUERIES || '1000'),
    aiTokens: parseInt(process.env.QUOTA_FREE_AI_TOKENS || '10000'),
    airbyteSyncs: parseInt(process.env.QUOTA_FREE_AIRBYTE_SYNCS || '5'),
  },
  PRO: {
    queries: parseInt(process.env.QUOTA_PRO_QUERIES || '50000'),
    aiTokens: parseInt(process.env.QUOTA_PRO_AI_TOKENS || '500000'),
    airbyteSyncs: parseInt(process.env.QUOTA_PRO_AIRBYTE_SYNCS || '100'),
  },
  ENTERPRISE: {
    queries: -1,
    aiTokens: -1,
    airbyteSyncs: -1,
  },
};

@Injectable()
export class QuotaGuard implements CanActivate {
  private readonly logger = new Logger(QuotaGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const quotaType = this.reflector.getAllAndOverride<string>(QUOTA_TYPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Kalau tidak ada @UseQuota(), lewati guard
    if (!quotaType) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // AuthGuard yang handle jika tidak ada user
    if (!user) return true;

    const userId = user.sub || user.id;

    // Ambil user + team dalam satu query via join
    const userRecord = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { teamId: true },
    });

    if (!userRecord?.teamId) return true; // User tanpa tim tidak kena quota

    // Ambil data team secara terpisah
    const team = await this.prisma.team.findUnique({
      where: { id: userRecord.teamId },
      select: {
        subscriptionPlan: true,
        queriesUsed: true,
        aiTokensUsed: true,
        airbyteSyncsUsed: true,
      },
    });

    if (!team) return true;

    const plan = team.subscriptionPlan || 'FREE';
    const limits = QUOTA_LIMITS[plan] ?? QUOTA_LIMITS['FREE'];
    const limit = limits[quotaType] ?? 0;

    // -1 = unlimited (Enterprise)
    if (limit === -1) return true;

    const usageMap: Record<string, number> = {
      queries: team.queriesUsed,
      aiTokens: team.aiTokensUsed,
      airbyteSyncs: team.airbyteSyncsUsed,
    };
    const used = usageMap[quotaType] ?? 0;
    const percentage = Math.round((used / limit) * 100);

    if (used >= limit) {
      this.logger.warn(
        `Quota exceeded: team=${userRecord.teamId}, type=${quotaType}, ${used}/${limit} (${plan})`
      );
      throw new ForbiddenException({
        code: 'QUOTA_EXCEEDED',
        message: `Quota ${quotaType} sudah habis (${used}/${limit}). Upgrade ke plan lebih tinggi untuk melanjutkan.`,
        used,
        limit,
        plan,
        percentage,
        upgradeUrl: '/settings?tab=billing',
      });
    }

    // Inject quota info ke request (bisa dipakai controller kalau mau)
    request['quotaInfo'] = { quotaType, used, limit, plan, percentage };

    // Log warning jika mendekati 80%
    if (percentage >= 80) {
      this.logger.warn(
        `Quota warning: team=${userRecord.teamId}, type=${quotaType}, ${percentage}% (${used}/${limit})`
      );
    }

    return true;
  }
}
