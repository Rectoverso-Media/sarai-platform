import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

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
  async createNotification(userId: string, title: string, message: string) {
    return this.prisma.notification.create({
      data: { userId, title, message },
    });
  }

  // 6. Hapus notifikasi yang sudah dibaca (cleanup)
  async deleteReadNotifications(userId: string) {
    await this.prisma.notification.deleteMany({
      where: { userId, isRead: true },
    });
    return { message: 'Notifikasi yang sudah dibaca telah dihapus.' };
  }
}
