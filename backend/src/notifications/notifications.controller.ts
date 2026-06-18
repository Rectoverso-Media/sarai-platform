import { Controller, Get, Patch, Delete, Param, UseGuards, Req, Body, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // GET /notifications — Ambil semua notifikasi milik user yang login
  @Get()
  @ApiOperation({ summary: 'List semua notifikasi milik user yang login' })
  @ApiResponse({ status: 200, description: 'Daftar notifikasi berhasil diambil' })
  getAll(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.notificationsService.getNotifications(userId);
  }

  // GET /notifications/unread-count — Jumlah notifikasi belum dibaca (untuk badge)
  @Get('unread-count')
  @ApiOperation({ summary: 'Jumlah notifikasi yang belum dibaca (untuk badge counter)' })
  @ApiResponse({ status: 200, description: 'Jumlah unread berhasil diambil' })
  getUnreadCount(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.notificationsService.getUnreadCount(userId);
  }

  // PATCH /notifications/:id/read — Tandai satu notifikasi sudah dibaca
  @Patch(':id/read')
  @ApiOperation({ summary: 'Tandai satu notifikasi sebagai sudah dibaca' })
  @ApiResponse({ status: 200, description: 'Notifikasi berhasil ditandai dibaca' })
  markAsRead(@Req() req: any, @Param('id') notificationId: string) {
    const userId = req.user.sub || req.user.id;
    return this.notificationsService.markAsRead(notificationId, userId);
  }

  // PATCH /notifications/read-all — Tandai semua notifikasi sudah dibaca
  @Patch('read-all')
  @ApiOperation({ summary: 'Tandai semua notifikasi sebagai sudah dibaca' })
  @ApiResponse({ status: 200, description: 'Semua notifikasi berhasil ditandai dibaca' })
  markAllAsRead(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.notificationsService.markAllAsRead(userId);
  }

  // DELETE /notifications/read — Hapus semua notifikasi yang sudah dibaca
  @Delete('read')
  @ApiOperation({ summary: 'Hapus semua notifikasi yang sudah dibaca' })
  @ApiResponse({ status: 200, description: 'Notifikasi yang dibaca berhasil dihapus' })
  deleteRead(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.notificationsService.deleteReadNotifications(userId);
  }

  // ─── Team Notification Preferences ──────────────────────────────────────

  // GET /notifications/preferences — Ambil preferensi channel notifikasi team
  @Get('preferences')
  @ApiOperation({ summary: 'Ambil preferensi channel notifikasi team (Email, Slack, Webhook)' })
  @ApiResponse({ status: 200, description: 'Preferensi notifikasi berhasil diambil' })
  getPreferences(@Req() req: any) {
    const teamId = req.user.teamId;
    return this.notificationsService.getTeamNotificationPreferences(teamId);
  }

  // PUT /notifications/preferences — Update preferensi channel notifikasi team
  @Put('preferences')
  @ApiOperation({ summary: 'Update preferensi channel notifikasi team' })
  @ApiResponse({ status: 200, description: 'Preferensi berhasil diupdate' })
  updatePreferences(@Req() req: any, @Body() body: any) {
    const teamId = req.user.teamId;
    return this.notificationsService.updateTeamNotificationPreferences(teamId, body);
  }
}
