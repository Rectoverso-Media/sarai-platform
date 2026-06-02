import { Controller, Get, Patch, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // GET /notifications — Ambil semua notifikasi milik user yang login
  @Get()
  getAll(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.notificationsService.getNotifications(userId);
  }

  // GET /notifications/unread-count — Jumlah notifikasi belum dibaca (untuk badge)
  @Get('unread-count')
  getUnreadCount(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.notificationsService.getUnreadCount(userId);
  }

  // PATCH /notifications/:id/read — Tandai satu notifikasi sudah dibaca
  @Patch(':id/read')
  markAsRead(@Req() req: any, @Param('id') notificationId: string) {
    const userId = req.user.sub || req.user.id;
    return this.notificationsService.markAsRead(notificationId, userId);
  }

  // PATCH /notifications/read-all — Tandai semua notifikasi sudah dibaca
  @Patch('read-all')
  markAllAsRead(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.notificationsService.markAllAsRead(userId);
  }

  // DELETE /notifications/read — Hapus semua notifikasi yang sudah dibaca
  @Delete('read')
  deleteRead(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.notificationsService.deleteReadNotifications(userId);
  }
}
