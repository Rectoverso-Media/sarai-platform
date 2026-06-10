import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { AuthGuard } from '@nestjs/passport';

/**
 * REST endpoints untuk manajemen sesi & riwayat chat.
 * Chat streaming dilakukan via WebSocket (AiGateway) — bukan di sini.
 */
@Controller('ai')
@UseGuards(AuthGuard('jwt'))
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // GET /ai/sessions — Ambil semua sesi chat milik user
  @Get('sessions')
  getSessions(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.aiService.getChatSessions(userId);
  }

  // POST /ai/sessions — Buat sesi chat baru
  @Post('sessions')
  createSession(@Req() req: any, @Body('title') title?: string) {
    const userId = req.user.sub || req.user.id;
    return this.aiService.createChatSession(userId, title);
  }

  // GET /ai/sessions/:sessionId/messages — Ambil pesan dalam satu sesi
  @Get('sessions/:sessionId/messages')
  getMessages(@Req() req: any, @Param('sessionId') sessionId: string) {
    const userId = req.user.sub || req.user.id;
    return this.aiService.getChatMessages(sessionId, userId);
  }

  // PATCH /ai/sessions/:sessionId/title — Rename sesi
  @Patch('sessions/:sessionId/title')
  renameSession(
    @Req() req: any,
    @Param('sessionId') sessionId: string,
    @Body('title') title: string,
  ) {
    const userId = req.user.sub || req.user.id;
    return this.aiService.updateSessionTitle(sessionId, userId, title);
  }

  // DELETE /ai/sessions/:sessionId — Hapus sesi chat
  @Delete('sessions/:sessionId')
  deleteSession(@Req() req: any, @Param('sessionId') sessionId: string) {
    const userId = req.user.sub || req.user.id;
    return this.aiService.deleteChatSession(sessionId, userId);
  }
}