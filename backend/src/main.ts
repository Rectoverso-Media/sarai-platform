import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter'; 

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Izinkan frontend mengakses backend (support multiple origins untuk dev)
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Izinkan request tanpa origin (misalnya dari Postman/curl) atau dari allowed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  // Validasi input otomatis: whitelist membuang properti tak dikenal, transform konversi tipe otomatis
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,    // Buang properti yang tidak ada di DTO
      transform: true,    // Konversi tipe otomatis (string → number, dll)
      forbidNonWhitelisted: false, // Log warning tapi jangan error (lebih lenient)
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(3001);
}
bootstrap();