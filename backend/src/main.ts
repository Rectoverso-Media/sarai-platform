import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter'; // 👈 Import ini

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Mengizinkan frontend Next.js (port 3000) mengakses backend ini
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  // Validasi input otomatis 
  app.useGlobalPipes(new ValidationPipe());

  // 👇 Daftarkan Global Error Handler di sini
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(3001);
}
bootstrap();