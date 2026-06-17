import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

/**
 * Auth Integration Tests (E2E)
 *
 * Catatan: Test ini membutuhkan database dan Redis yang berjalan.
 * Untuk CI, gunakan service container di GitHub Actions.
 * Untuk local testing, jalankan: docker compose up postgres-db redis -d
 *
 * Cara jalankan: npm run test:e2e
 */

// Membuat minimal test module yang mock semua external deps
// Ini adalah pendekatan yang BENAR untuk integration test di NestJS
// tanpa butuh DB nyata (menggunakan in-memory mocks)

describe('Auth Endpoints (Integration)', () => {
  let app: INestApplication<App>;

  // Mock dependencies agar tidak butuh DB nyata
  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  beforeAll(async () => {
    // Lazy import untuk menghindari masalah module resolution
    const { AppModule } = await import('../src/app.module');
    const { PrismaService } = await import('../src/prisma/prisma.service');
    const { HttpExceptionFilter } = await import('../src/common/filters/http-exception.filter');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();

    // Apply same pipes/filters as production main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── POST /auth/register ──────────────────────────────────────

  describe('POST /auth/register', () => {
    it('should return 201 untuk registrasi berhasil', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'new-user-1',
        name: 'Test User',
        email: 'integration@test.com',
        password: 'hashed-pass',
        twoFactorSecret: null,
        isEmailVerified: false,
      });

      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'integration@test.com',
          password: 'SecurePass123!',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toContain('Registrasi sukses');
          expect(res.body.user).not.toHaveProperty('password');
        });
    });

    it('should return 400 jika email sudah terdaftar', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: 'existing@test.com',
      });

      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'existing@test.com',
          password: 'SecurePass123!',
        })
        .expect(400);
    });
  });

  // ─── POST /auth/login ─────────────────────────────────────────

  describe('POST /auth/login', () => {
    it('should return 401 untuk credential salah', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'wrong@test.com', password: 'WrongPass123!' })
        .expect(401);
    });
  });

  // ─── GET /users (RBAC protected) ─────────────────────────────

  describe('GET /users', () => {
    it('should return 401 tanpa JWT token', async () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });

    it('should return response dengan format error yang benar (statusCode, message, timestamp, path)', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path', '/users');
    });
  });

  // ─── POST /auth/forgot-password ───────────────────────────────

  describe('POST /auth/forgot-password', () => {
    it('should return 201 dengan pesan generic (user enumeration prevention)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@test.com' })
        .expect(201);

      // Pesan harus sama regardless email ada atau tidak (cegah user enumeration)
      expect(response.body.message).toContain('Jika email terdaftar');
    });
  });

  // ─── Response format consistency ─────────────────────────────

  describe('Error Response Format', () => {
    it('should selalu return format JSON yang konsisten untuk semua error', async () => {
      const response = await request(app.getHttpServer())
        .get('/non-existent-endpoint-12345')
        .expect(404);

      // Format harus konsisten di semua error
      expect(response.body).toMatchObject({
        statusCode: expect.any(Number),
        timestamp: expect.any(String),
        path: expect.any(String),
        message: expect.any(String),
      });
    });
  });
});
