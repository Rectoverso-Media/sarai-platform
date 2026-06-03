import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

// Kuota data source per subscription plan
const PLAN_QUOTA: Record<string, number> = {
  FREE: 3,
  PRO: 10,
  ENTERPRISE: Infinity,
};

@Injectable()
export class TrialService {
  private readonly logger = new Logger(TrialService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Cek semua DataSource yang trial-nya sudah expired, update status,
   * dan kirim notifikasi ke owner tim terkait.
   * Dipanggil oleh DatasourcesScheduler setiap tengah malam.
   */
  async checkTrialExpiry(): Promise<void> {
    const now = new Date();

    const expiredSources = await this.prisma.dataSource.findMany({
      where: {
        isTrialActive: true,
        trialEndsAt: { lt: now },
      },
    });

    if (expiredSources.length === 0) {
      this.logger.log('Trial expiry check: tidak ada data source yang expired.');
      return;
    }

    this.logger.log(
      `Trial expiry check: ditemukan ${expiredSources.length} data source yang expired.`,
    );

    for (const source of expiredSources) {
      await this.enforceTrialExpiry(source.id);
    }
  }

  /**
   * Expired-kan satu DataSource: update status, kirim notifikasi ke owner tim.
   */
  async enforceTrialExpiry(dataSourceId: string): Promise<void> {
    // Update status data source
    const updated = await this.prisma.dataSource.update({
      where: { id: dataSourceId },
      data: {
        isTrialActive: false,
        status: 'Expired',
      },
    });

    this.logger.warn(
      `DataSource "${updated.name}" (${dataSourceId}) telah expired, status diperbarui ke Expired.`,
    );

    // Cari owner tim yang memiliki data source ini
    // DataSource bisa terhubung ke team melalui relasi airbyteSourceId
    // Fallback: notify semua user yang punya role OWNER
    const owners = await this.prisma.user.findMany({
      where: {
        teamMemberships: {
          some: { role: 'OWNER' },
        },
      },
      take: 5, // Batasi agar tidak spam
    });

    for (const owner of owners) {
      await this.notificationsService.createNotification(
        owner.id,
        '⚠️ Trial Data Source Berakhir',
        `Trial untuk "${updated.name}" (${updated.connectorName ?? updated.sourceType}) telah berakhir. Upgrade plan Anda untuk melanjutkan akses data.`,
      );
    }
  }

  /**
   * Cek apakah tim masih dalam kuota data source berdasarkan plan.
   * Lempar ForbiddenException jika sudah di batas.
   * @param teamId - ID tim yang akan ditambahkan data source
   * @param plan - Plan subscription (FREE | PRO | ENTERPRISE)
   */
  async checkQuota(teamId: string, plan: string = 'FREE'): Promise<void> {
    const quota = PLAN_QUOTA[plan.toUpperCase()] ?? PLAN_QUOTA['FREE'];

    if (quota === Infinity) {
      // Enterprise: tidak ada limit
      return;
    }

    // Hitung jumlah data source aktif (bukan expired) di tim ini
    // Karena DataSource belum punya relasi langsung ke Team,
    // kita count berdasarkan semua datasources yang status-nya aktif
    const activeCount = await this.prisma.dataSource.count({
      where: {
        status: { not: 'Expired' },
      },
    });

    if (activeCount >= quota) {
      throw new ForbiddenException(
        `Batas data source untuk plan ${plan} adalah ${quota}. ` +
          `Upgrade plan Anda untuk menambahkan lebih banyak koneksi.`,
      );
    }

    this.logger.log(
      `Quota check OK: ${activeCount}/${quota} data sources aktif (plan: ${plan})`,
    );
  }

  /**
   * Kembalikan informasi kuota tim saat ini (untuk ditampilkan di UI)
   */
  async getQuotaInfo(plan: string = 'FREE'): Promise<{
    plan: string;
    used: number;
    limit: number | null;
    remaining: number | null;
  }> {
    const quota = PLAN_QUOTA[plan.toUpperCase()] ?? PLAN_QUOTA['FREE'];

    const activeCount = await this.prisma.dataSource.count({
      where: {
        status: { not: 'Expired' },
      },
    });

    return {
      plan,
      used: activeCount,
      limit: quota === Infinity ? null : quota,
      remaining: quota === Infinity ? null : Math.max(0, quota - activeCount),
    };
  }
}
