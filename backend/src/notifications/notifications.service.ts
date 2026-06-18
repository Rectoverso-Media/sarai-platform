import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { EmailService } from '../email/email.service';
import { firstValueFrom } from 'rxjs';

export interface NotificationChannelConfig {
  inApp: boolean;
  email: boolean;
  slack: boolean;
  webhook: boolean;
  slackWebhookUrl?: string;
  webhookUrl?: string;
  emailAddress?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly emailService: EmailService,
  ) {}

  // 1. Ambil semua notifikasi milik user yang login
  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50, // Batasi 50 notifikasi terbaru
    });
  }

  // 2. Hitung jumlah notifikasi yang belum dibaca (untuk badge di navbar)
  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { unreadCount: count };
  }

  // 3. Tandai satu notifikasi sebagai sudah dibaca
  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notifikasi tidak ditemukan!');
    }

    // Pastikan notifikasi ini milik user yang request
    if (notification.userId !== userId) {
      throw new NotFoundException('Notifikasi tidak ditemukan!');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  // 4. Tandai SEMUA notifikasi user sebagai sudah dibaca
  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { message: 'Semua notifikasi telah ditandai sudah dibaca.' };
  }

  // 5. Buat notifikasi baru (dipanggil oleh sistem/service lain)
  // Enhanced: dispatch ke multi-channel berdasarkan team preferences
  async createNotification(userId: string, title: string, message: string) {
    // Always create in-app notification
    const notification = await this.prisma.notification.create({
      data: { userId, title, message },
    });

    // Dispatch to other channels asynchronously (best-effort)
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, teamId: true },
      });

      if (user?.teamId) {
        const team = await this.prisma.team.findUnique({
          where: { id: user.teamId },
        });

        const channels = (team as any)?.notificationChannels as NotificationChannelConfig | undefined;

        if (channels) {
          // Email notification
          if (channels.email && (channels.emailAddress || user.email)) {
            this.sendEmailNotification(
              channels.emailAddress || user.email,
              title,
              message,
            ).catch((err) => this.logger.warn(`Email notification failed: ${err.message}`));
          }

          // Slack notification
          if (channels.slack && channels.slackWebhookUrl) {
            this.sendSlackNotification(channels.slackWebhookUrl, title, message)
              .catch((err) => this.logger.warn(`Slack notification failed: ${err.message}`));
          }

          // Webhook notification
          if (channels.webhook && channels.webhookUrl) {
            this.sendWebhookNotification(channels.webhookUrl, { title, message, userId, timestamp: new Date().toISOString() })
              .catch((err) => this.logger.warn(`Webhook notification failed: ${err.message}`));
          }
        }
      }
    } catch (err) {
      this.logger.warn(`Multi-channel dispatch failed: ${(err as Error).message}`);
    }

    return notification;
  }

  // 6. Hapus notifikasi yang sudah dibaca (cleanup)
  async deleteReadNotifications(userId: string) {
    await this.prisma.notification.deleteMany({
      where: { userId, isRead: true },
    });
    return { message: 'Notifikasi yang sudah dibaca telah dihapus.' };
  }

  // ─── Multi-Channel Methods ─────────────────────────────────────────────

  /** Kirim notifikasi via Email */
  async sendEmailNotification(to: string, subject: string, body: string): Promise<void> {
    await this.emailService.sendEmail(
      to,
      `[SARAI] ${subject}`,
      `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #3b82f6;">🔔 ${subject}</h2>
          <p style="color: #374151; font-size: 14px; line-height: 1.6;">${body}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">
            Notifikasi ini dikirim dari platform SARAI. 
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings/notifications">Kelola preferensi notifikasi</a>
          </p>
        </div>
      `,
    );
    this.logger.log(`Email notification sent to ${to}`);
  }

  /** Kirim notifikasi via Slack Webhook */
  async sendSlackNotification(webhookUrl: string, title: string, message: string): Promise<void> {
    const payload = {
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: `🔔 ${title}` },
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: message },
        },
        {
          type: 'context',
          elements: [
            { type: 'mrkdwn', text: `_SARAI Platform • ${new Date().toLocaleString('id-ID')}_` },
          ],
        },
      ],
    };

    await firstValueFrom(this.httpService.post(webhookUrl, payload));
    this.logger.log('Slack notification sent');
  }

  /** Kirim notifikasi via custom Webhook */
  async sendWebhookNotification(url: string, payload: Record<string, any>): Promise<void> {
    await firstValueFrom(
      this.httpService.post(url, {
        event: 'notification',
        source: 'sarai-platform',
        ...payload,
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }),
    );
    this.logger.log(`Webhook notification sent to ${url}`);
  }

  // ─── Team Notification Preferences ─────────────────────────────────────

  /** Get notification preferences for a team */
  async getTeamNotificationPreferences(teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });
    if (!team) throw new NotFoundException('Team tidak ditemukan');

    return (team as any).notificationChannels ?? {
      inApp: true,
      email: false,
      slack: false,
      webhook: false,
    };
  }

  /** Update notification preferences for a team */
  async updateTeamNotificationPreferences(teamId: string, preferences: Partial<NotificationChannelConfig>) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });
    if (!team) throw new NotFoundException('Team tidak ditemukan');

    const current = (team as any).notificationChannels ?? {};
    const updated = { ...current, ...preferences, inApp: true }; // inApp selalu aktif

    await this.prisma.team.update({
      where: { id: teamId },
      data: { notificationChannels: updated } as any,
    });

    return { message: 'Preferensi notifikasi berhasil diupdate', channels: updated };
  }
}
