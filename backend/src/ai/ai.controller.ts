import {
  Controller, Get, Post, Delete, Patch, Body, Param, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AuthGuard } from '@nestjs/passport';

/**
 * REST endpoints untuk manajemen sesi & riwayat chat.
 * Chat streaming dilakukan via WebSocket (AiGateway) — bukan di sini.
 */
@ApiTags('AI')
@ApiBearerAuth('JWT-auth')
@Controller('ai')
@UseGuards(AuthGuard('jwt'))
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('sessions')
  @ApiOperation({ summary: 'Ambil semua sesi chat milik user yang login' })
  @ApiResponse({ status: 200, description: 'Daftar sesi chat berhasil diambil' })
  getSessions(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.aiService.getChatSessions(userId);
  }

  @Post('sessions')
  @ApiOperation({ summary: 'Buat sesi chat AI baru' })
  @ApiResponse({ status: 201, description: 'Sesi chat berhasil dibuat' })
  createSession(@Req() req: any, @Body('title') title?: string) {
    const userId = req.user.sub || req.user.id;
    return this.aiService.createChatSession(userId, title);
  }

  @Get('sessions/:sessionId/messages')
  @ApiOperation({ summary: 'Ambil semua pesan dalam satu sesi chat' })
  @ApiResponse({ status: 200, description: 'Daftar pesan berhasil diambil' })
  @ApiResponse({ status: 404, description: 'Sesi tidak ditemukan' })
  getMessages(@Req() req: any, @Param('sessionId') sessionId: string) {
    const userId = req.user.sub || req.user.id;
    return this.aiService.getChatMessages(sessionId, userId);
  }

  @Patch('sessions/:sessionId/title')
  @ApiOperation({ summary: 'Rename judul sesi chat' })
  @ApiResponse({ status: 200, description: 'Judul sesi berhasil diupdate' })
  renameSession(
    @Req() req: any,
    @Param('sessionId') sessionId: string,
    @Body('title') title: string,
  ) {
    const userId = req.user.sub || req.user.id;
    return this.aiService.updateSessionTitle(sessionId, userId, title);
  }

  @Delete('sessions/:sessionId')
  @ApiOperation({ summary: 'Hapus sesi chat beserta semua pesannya' })
  @ApiResponse({ status: 200, description: 'Sesi chat berhasil dihapus' })
  @ApiResponse({ status: 404, description: 'Sesi tidak ditemukan' })
  deleteSession(@Req() req: any, @Param('sessionId') sessionId: string) {
    const userId = req.user.sub || req.user.id;
    return this.aiService.deleteChatSession(sessionId, userId);
  }
}