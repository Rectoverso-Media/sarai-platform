import { Controller, Get, Query, Sse, MessageEvent } from '@nestjs/common';
import { AiService } from './ai.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // Endpoint: GET /ai/chat-stream?message=Hello
  @Sse('chat-stream')
  streamChat(@Query('message') message: string): Observable<MessageEvent> {
    if (!message) {
      throw new Error('Message is required');
    }

    return this.aiService.streamChatResponse(message).pipe(
      // Memastikan tipe datanya sesuai standar SSE NestJS (MessageEvent)
      map((payload) => ({ data: payload.data } as MessageEvent))
    );
  }
}