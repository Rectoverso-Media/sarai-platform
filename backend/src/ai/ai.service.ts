import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import OpenAI from 'openai';

import { Observable } from 'rxjs';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(
    private prisma: PrismaService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,

      baseURL:
        'https://gpt4.mirbuds.com/v1',
    });
  }

  streamChatResponse(
    userMessage: string,
  ): Observable<any> {
    return new Observable(
      (subscriber) => {
        const systemPrompt = `
You are SARAI, an advanced data analytics AI assistant.

Your job is to help users analyze their integrated database and provide insightful summaries.

Be concise, professional, and directly answer the user's questions.
`;

        this.executeOpenAiStream(
          userMessage,
          systemPrompt,
          subscriber,
        );
      },
    );
  }

  private async executeOpenAiStream(
    userMessage: string,
    systemPrompt: string,
    subscriber: any,
  ) {
    try {

      console.log(
        '🚀 Request ke Mirbuds AI...',
      );

      // =========================
      // NON STREAM MODE
      // =========================

      const response =
        await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',

          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userMessage,
            },
          ],
        });

      console.log(
        '✅ RESPONSE:',
        JSON.stringify(
          response,
          null,
          2,
        ),
      );

      // Ambil text response
      const text =
        response?.choices?.[0]?.message
          ?.content ||
        'AI tidak memberikan respons.';

      // =========================
      // FAKE STREAMING
      // =========================

      const words = text.split(' ');

      for (const word of words) {

        subscriber.next({
          data: {
            text: word + ' ',
          },
        });

        await new Promise((resolve) =>
          setTimeout(resolve, 30),
        );
      }

      // DONE
      subscriber.next({
        data: {
          status: 'DONE',
        },
      });

      subscriber.complete();

      console.log(
        '✅ Streaming selesai',
      );

    } catch (error: any) {

      console.error(
        '❌ AI ERROR:',
        error,
      );

      subscriber.error(
        new InternalServerErrorException(
          error?.message ||
            'Gagal memproses AI response',
        ),
      );
    }
  }
}