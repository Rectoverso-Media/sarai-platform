import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const isProd = process.env.NODE_ENV === 'production';

  // ─── Security Headers (Helmet) ───────────────────────────────────────────
  app.use(helmet({
    crossOriginEmbedderPolicy: false, // Next.js butuh ini untuk image loading
    contentSecurityPolicy: isProd ? undefined : false, // Disable CSP di dev
  }));

  // ─── CORS ────────────────────────────────────────────────────────────────
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Di production: tolak request tanpa origin (cegah akses langsung dari server/curl)
      // Di development: izinkan untuk memudahkan testing dengan Postman
      if (!isProd && !origin) {
        return callback(null, true);
      }
      if (origin && allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`Origin '${origin}' tidak diizinkan oleh CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
  });

  // ─── Validation Pipe ─────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,              // Buang properti yang tidak ada di DTO
      transform: true,              // Konversi tipe otomatis (string → number, dll)
      forbidNonWhitelisted: true,   // Tolak request jika ada properti tak dikenal (security)
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ─── Global Exception Filter ──────────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());

  // ─── Swagger / OpenAPI Documentation ─────────────────────────────────────
  if (!isProd) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('SARAI API')
      .setDescription(
        'SARAI — System for Analysis & Response AI\n\n' +
        'Platform untuk mengagregasi data dari 600+ sumber menjadi business insights berbasis AI.\n\n' +
        '**Authentication:** Gunakan endpoint `POST /auth/login` untuk mendapatkan JWT token, ' +
        'lalu klik tombol **Authorize** dan masukkan: `Bearer <your-token>`',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Masukkan JWT access token yang didapat dari POST /auth/login',
        },
        'JWT-auth',
      )
      .addTag('Auth', 'Autentikasi, registrasi, OAuth Google, 2FA, dan manajemen token')
      .addTag('Users', 'Manajemen profil pengguna')
      .addTag('Team', 'Manajemen tim dan undangan anggota')
      .addTag('Datasources', 'Koneksi dan manajemen data source via Airbyte')
      .addTag('Queries', 'Query builder, eksekusi, dan penjadwalan')
      .addTag('Dashboard', 'CRUD dashboard, widget, dan public sharing')
      .addTag('Blends', 'Data blending (join engine) dari multiple sources')
      .addTag('AI', 'SARAI AI Chat dan Insights berbasis AI')
      .addTag('Billing', 'Subscription Stripe, quota, dan usage tracking')
      .addTag('Export', 'Export data ke CSV, Excel, Google Sheets')
      .addTag('Audit', 'Audit log dan riwayat aksi pengguna')
      .addTag('Security', 'Keamanan dan monitoring sesi')
      .addTag('Notifications', 'Notifikasi dan alert rules')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true, // Simpan token di browser saat reload
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
      customSiteTitle: 'SARAI API Docs',
    });
    logger.log('📖 Swagger docs tersedia di: http://localhost:3001/api/docs');
  }

  // ─── Start Server ─────────────────────────────────────────────────────────
  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`🚀 SARAI Backend berjalan di: http://localhost:${port}`);
  logger.log(`🌍 Environment: ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}`);
}
bootstrap();
