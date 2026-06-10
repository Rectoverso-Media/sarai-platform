import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { AiService } from './ai.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  namespace: '/ai',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class AiGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AiGateway.name);

  constructor(
    private readonly aiService: AiService,
    private readonly jwtService: JwtService,
  ) {}

  // ================================================================
  // LIFECYCLE — Validasi JWT saat koneksi pertama kali (handshake)
  // ================================================================
  async handleConnection(client: Socket) {
    try {
      // Token dikirim via handshake auth (AMAN — tidak pernah di URL bar)
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} disconnected: no token`);
        client.emit('error', { message: 'Unauthorized: token required' });
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      // Simpan user info ke socket data agar bisa dipakai di handlers
      client.data.userId = payload.sub || payload.id;
      client.data.email = payload.email;
      this.logger.log(
        `Client connected: ${client.id} (user: ${client.data.email})`,
      );
    } catch {
      this.logger.warn(`Client ${client.id} disconnected: invalid token`);
      client.emit('error', { message: 'Unauthorized: invalid token' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ================================================================
  // EVENT: 'chat' — Terima pesan user, stream balasan AI
  // ================================================================
  @SubscribeMessage('chat')
  async handleChat(
    @MessageBody() data: { message: string; sessionId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    if (!userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    const { message, sessionId } = data;
    if (!message?.trim()) {
      client.emit('error', { message: 'Message cannot be empty' });
      return;
    }

    this.logger.log(`Chat from user ${userId}: "${message.substring(0, 50)}..."`);

    let fullResponse = '';

    try {
      // Stream balasan AI chunk by chunk ke client
      const stream = this.aiService.streamChatToSocket(message);

      for await (const chunk of stream) {
        fullResponse += chunk;
        client.emit('chat_chunk', { text: chunk });
      }

      // Beritahu frontend stream selesai
      client.emit('chat_done', { status: 'DONE' });

      // Auto-save chat history setelah stream selesai
      if (sessionId) {
        await this.aiService.saveMessage(sessionId, 'user', message);
        await this.aiService.saveMessage(sessionId, 'assistant', fullResponse);
        this.logger.log(`Messages saved to session ${sessionId}`);
      }
    } catch (error) {
      this.logger.error('Error in chat handler:', error);
      client.emit('chat_error', {
        message: 'Gagal memproses AI response. Silakan coba lagi.',
      });
    }
  }
}
