import { Controller, Query, Sse, MessageEvent } from '@nestjs/common';
import { AiService } from './ai.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Sse('chat-stream')
  streamChat(@Query('message') message: string): Observable<MessageEvent> {
    if (!message) {
      throw new Error('Message parameter is required');
    }

    return this.aiService.streamChatResponse(message).pipe(
      //  Tambahkan deklarasi ": any" untuk memuaskan TypeScript Strict Mode
      map((payload: any) => ({ data: payload.data } as MessageEvent))
    );
  }
}