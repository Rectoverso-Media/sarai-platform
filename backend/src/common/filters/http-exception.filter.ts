import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    // Tentukan apakah error ini kita yang buat (HttpException) atau error sistem
    const status = 
      exception instanceof HttpException 
        ? exception.getStatus() 
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Tangkap pesan error aslinya
    const exceptionResponse = 
      exception instanceof HttpException 
        ? exception.getResponse() 
        : null;

    let message = 'Terjadi kesalahan pada server (Internal Server Error)';
    
    if (exceptionResponse) {
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
        // Mengambil array pesan (biasanya dari validasi class-validator) atau string
        const msg = (exceptionResponse as any).message;
        message = Array.isArray(msg) ? msg[0] : msg;
      }
    } else if (exception instanceof Error) {
       // Untuk log server internal, kita tampilkan di console, tapi user tetap dapat pesan umum
       console.error('CRITICAL ERROR:', exception);
    }

    // Format output JSON yang rapi untuk dikonsumsi Frontend
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
    });
  }
}