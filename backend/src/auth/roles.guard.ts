import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';

/**
 * Guard untuk menegakkan Role-Based Access Control (RBAC).
 * Harus selalu dikombinasikan dengan AuthGuard('jwt') agar req.user sudah terisi.
 *
 * Hierarki role (dari tertinggi ke terendah):
 * OWNER > ADMIN > EDITOR > VIEWER
 *
 * Contoh penggunaan:
 * @UseGuards(AuthGuard('jwt'), RolesGuard)
 * @Roles(Role.OWNER, Role.ADMIN)
 * @Delete(':id')
 * deleteResource() { ... }
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Ambil role yang dibutuhkan dari metadata decorator @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. Kalau tidak ada @Roles() di endpoint ini, berarti siapapun bisa akses
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 3. Ambil user dari request (sudah diisi oleh JwtStrategy.validate())
    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      throw new ForbiddenException('Akses ditolak: Role tidak ditemukan');
    }

    // 4. Definisikan hierarki role (nilai lebih tinggi = lebih powerful)
    const roleHierarchy: Record<Role, number> = {
      [Role.OWNER]: 4,
      [Role.ADMIN]: 3,
      [Role.EDITOR]: 2,
      [Role.VIEWER]: 1,
    };

    const userRoleLevel = roleHierarchy[user.role as Role] ?? 0;

    // 5. Cek apakah user memiliki salah satu role yang dibutuhkan
    const hasPermission = requiredRoles.some((requiredRole) => {
      const requiredLevel = roleHierarchy[requiredRole] ?? 0;
      return userRoleLevel >= requiredLevel;
    });

    if (!hasPermission) {
      throw new ForbiddenException(
        `Akses ditolak: Butuh role ${requiredRoles.join(' atau ')} untuk aksi ini`,
      );
    }

    return true;
  }
}
