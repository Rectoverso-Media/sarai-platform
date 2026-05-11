import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; 
import OpenAI from 'openai';
import { Observable, Subscriber } from 'rxjs';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(private prisma: PrismaService) {
    // ⚡ Arahkan SDK OpenAI ke server Groq
    this.openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY, 
      baseURL: 'https://api.groq.com/openai/v1', 
    });
  }

  streamChatResponse(userMessage: string): Observable<any> {
    return new Observable((subscriber) => {
      const systemPrompt = `You are SARAI, an advanced data analytics AI assistant. 
      Your job is to help users analyze their integrated database and provide insightful summaries.
      Be concise, professional, and directly answer the user's questions in Indonesian.`;

      this.executeGroqStream(userMessage, systemPrompt, subscriber);
    });
  }

  private async executeGroqStream(userMessage: string, systemPrompt: string, subscriber: Subscriber<any>) {
    try {
      console.log(`🤖 Menerima pesan: "${userMessage}"`);
      console.log('⚡ Menghubungkan ke Groq API...');

      const stream = await this.openai.chat.completions.create({
        // Model Llama 3 8B milik Groq yang super cepat dan gratis
        model: 'llama-3.1-8b-instant', 
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        stream: true, 
      });

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) {
          subscriber.next({ data: { text: text } });
        }
      }

      subscriber.next({ data: { status: 'DONE' } });
      subscriber.complete();
      console.log('✅ Selesai streaming balasan dari Groq!');

    } catch (error) {
      console.error('Groq API Error:', error);
      subscriber.error(new InternalServerErrorException('Gagal memproses AI response dari Groq'));
    }
  }
}