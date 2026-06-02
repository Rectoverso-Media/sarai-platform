import { Controller, Query, Sse, MessageEvent, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AiService } from './ai.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthGuard } from '@nestjs/passport';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // SSE streaming chat (publik — tidak perlu JWT karena SSE tidak bisa kirim header mudah)
  @Sse('chat-stream')
  streamChat(@Query('message') message: string): Observable<MessageEvent> {
    if (!message) {
      throw new Error('Message parameter is required');
    }

    return this.aiService.streamChatResponse(message).pipe(
      map((payload: any) => ({ data: payload.data } as MessageEvent))
    );
  }

  // ============================================
  // CHAT HISTORY ENDPOINTS (Butuh JWT)
  // ============================================

  // GET /ai/sessions — Ambil semua sesi chat milik user
  @UseGuards(AuthGuard('jwt'))
  @Get('sessions')
  getSessions(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.aiService.getChatSessions(userId);
  }

  // POST /ai/sessions — Buat sesi chat baru
  @UseGuards(AuthGuard('jwt'))
  @Post('sessions')
  createSession(@Req() req: any, @Body('title') title?: string) {
    const userId = req.user.sub || req.user.id;
    return this.aiService.createChatSession(userId, title);
  }

  // GET /ai/sessions/:sessionId/messages — Ambil pesan dalam satu sesi
  @UseGuards(AuthGuard('jwt'))
  @Get('sessions/:sessionId/messages')
  getMessages(@Req() req: any, @Param('sessionId') sessionId: string) {
    const userId = req.user.sub || req.user.id;
    return this.aiService.getChatMessages(sessionId, userId);
  }

  // POST /ai/sessions/:sessionId/messages — Simpan pesan ke sesi
  @UseGuards(AuthGuard('jwt'))
  @Post('sessions/:sessionId/messages')
  saveMessage(
    @Param('sessionId') sessionId: string,
    @Body() body: { role: 'user' | 'assistant'; content: string }
  ) {
    return this.aiService.saveMessage(sessionId, body.role, body.content);
  }

  // DELETE /ai/sessions/:sessionId — Hapus sesi chat
  @UseGuards(AuthGuard('jwt'))
  @Delete('sessions/:sessionId')
  deleteSession(@Req() req: any, @Param('sessionId') sessionId: string) {
    const userId = req.user.sub || req.user.id;
    return this.aiService.deleteChatSession(sessionId, userId);
  }
}