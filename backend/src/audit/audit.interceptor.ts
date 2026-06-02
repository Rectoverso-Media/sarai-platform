import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';

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
                  payload: body?.password ? '***REDACTED***' : body,
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