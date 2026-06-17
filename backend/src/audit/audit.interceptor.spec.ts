import { AuditInterceptor } from './audit.interceptor';
import { PrismaService } from '../prisma/prisma.service';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

const mockPrismaService = {
  auditLog: {
    create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
  },
};

function createMockExecutionContext(requestOverrides: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'POST',
        originalUrl: '/test/endpoint',
        ip: '127.0.0.1',
        user: { email: 'admin@example.com' },
        body: {},
        ...requestOverrides,
      }),
    }),
  } as any;
}

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;

  beforeEach(() => {
    interceptor = new AuditInterceptor(mockPrismaService as any);
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  // ─── Rekam mutasi ─────────────────────────────────────────────────────────

  it('should membuat audit log untuk POST request', (done) => {
    const ctx = createMockExecutionContext({ method: 'POST' });
    const handler: CallHandler = { handle: () => of({ result: 'ok' }) };

    interceptor.intercept(ctx, handler).subscribe(() => {
      setTimeout(() => {
        expect(mockPrismaService.auditLog.create).toHaveBeenCalledTimes(1);
        expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              action: 'POST /test/endpoint',
              actor: 'admin@example.com',
            }),
          }),
        );
        done();
      }, 10);
    });
  });

  it('should membuat audit log untuk DELETE request', (done) => {
    const ctx = createMockExecutionContext({ method: 'DELETE', originalUrl: '/datasources/123' });
    const handler: CallHandler = { handle: () => of(null) };

    interceptor.intercept(ctx, handler).subscribe(() => {
      setTimeout(() => {
        expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ action: 'DELETE /datasources/123' }),
          }),
        );
        done();
      }, 10);
    });
  });

  it('TIDAK boleh membuat audit log untuk GET request', (done) => {
    const ctx = createMockExecutionContext({ method: 'GET' });
    const handler: CallHandler = { handle: () => of([]) };

    interceptor.intercept(ctx, handler).subscribe(() => {
      setTimeout(() => {
        expect(mockPrismaService.auditLog.create).not.toHaveBeenCalled();
        done();
      }, 10);
    });
  });

  // ─── Sensitive data redaction ─────────────────────────────────────────────

  it('should REDACT field password dari body', (done) => {
    const ctx = createMockExecutionContext({
      method: 'POST',
      body: { email: 'test@example.com', password: 'secret123' },
    });
    const handler: CallHandler = { handle: () => of({ success: true }) };

    interceptor.intercept(ctx, handler).subscribe(() => {
      setTimeout(() => {
        const createCall = mockPrismaService.auditLog.create.mock.calls[0][0];
        const loggedDetails = JSON.parse(createCall.data.details);
        expect(loggedDetails.payload.password).toBe('***REDACTED***');
        expect(loggedDetails.payload.email).toBe('test@example.com'); // email tidak diprotect
        done();
      }, 10);
    });
  });

  it('should REDACT field newPassword, token, dan apiKey', (done) => {
    const ctx = createMockExecutionContext({
      method: 'PATCH',
      body: {
        newPassword: 'NewPass123!',
        token: 'some-reset-token',
        apiKey: 'sk-proj-secret',
        name: 'John Doe', // field normal, tidak di-redact
      },
    });
    const handler: CallHandler = { handle: () => of({ success: true }) };

    interceptor.intercept(ctx, handler).subscribe(() => {
      setTimeout(() => {
        const createCall = mockPrismaService.auditLog.create.mock.calls[0][0];
        const loggedDetails = JSON.parse(createCall.data.details);
        expect(loggedDetails.payload.newPassword).toBe('***REDACTED***');
        expect(loggedDetails.payload.token).toBe('***REDACTED***');
        expect(loggedDetails.payload.apiKey).toBe('***REDACTED***');
        expect(loggedDetails.payload.name).toBe('John Doe'); // tidak di-redact
        done();
      }, 10);
    });
  });

  it('should menggunakan "System / Anonymous" sebagai actor jika user tidak login', (done) => {
    const ctx = createMockExecutionContext({ method: 'POST', user: null });
    const handler: CallHandler = { handle: () => of({}) };

    interceptor.intercept(ctx, handler).subscribe(() => {
      setTimeout(() => {
        const createCall = mockPrismaService.auditLog.create.mock.calls[0][0];
        expect(createCall.data.actor).toBe('System / Anonymous');
        done();
      }, 10);
    });
  });

  it('should tidak crash jika prisma auditLog.create gagal', (done) => {
    mockPrismaService.auditLog.create.mockRejectedValueOnce(new Error('DB error'));
    const ctx = createMockExecutionContext({ method: 'POST' });
    const handler: CallHandler = { handle: () => of({}) };

    // Tidak boleh throw error ke client
    interceptor.intercept(ctx, handler).subscribe({
      next: () => {
        setTimeout(() => {
          expect(console.error).toHaveBeenCalledWith(
            'Gagal mencatat Audit Log:',
            expect.any(Error),
          );
          done();
        }, 10);
      },
      error: () => done.fail('Should not propagate error to handler'),
    });
  });
});
