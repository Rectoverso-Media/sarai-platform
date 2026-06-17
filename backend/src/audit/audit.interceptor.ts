import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';

// Daftar field yang dianggap sensitif dan harus di-redact dari audit log
const SENSITIVE_FIELDS = new Set([
  'password', 'newPassword', 'oldPassword', 'confirmPassword',
  'token', 'refreshToken', 'tempToken', 'resetToken', 'verifyToken',
  'secret', 'twoFactorSecret', 'apiKey', 'privateKey', 'clientSecret',
  'smtpPass', 'stripeKey', 'webhookSecret', 'authorization',
]);

function redactSensitiveData(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redactSensitiveData);

  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      const lowerKey = key.toLowerCase();
      const isSensitive = [...SENSITIVE_FIELDS].some(
        (field) => lowerKey.includes(field.toLowerCase()),
      );
      return [key, isSensitive ? '***REDACTED***' : redactSensitiveData(value)];
    }),
  );
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, originalUrl, ip, user, body } = req;

    // Hanya rekam aksi Mutasi (Write/Update/Delete)
    const isWriteAction = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    return next.handle().pipe(
      tap(async () => {
        if (isWriteAction) {
          try {
            await this.prisma.auditLog.create({
              data: {
                action: `${method} ${originalUrl}`,
                actor: user?.email || user?.id || 'System / Anonymous',
                details: JSON.stringify({
                  payload: redactSensitiveData(body),
                }),
                ipAddress: ip || '127.0.0.1',
              }
            });
          } catch (error) {
            console.error('Gagal mencatat Audit Log:', error);
          }
        }
      }),
    );
  }
}
