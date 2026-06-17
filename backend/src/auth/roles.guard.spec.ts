import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';

// Helper untuk membuat mock ExecutionContext
function createMockExecutionContext(user: any, requiredRoles?: Role[]): ExecutionContext {
  const mockReflector = {
    getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
  };

  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard, Reflector],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  // ─── No @Roles decorator ──────────────────────────────────────────────────

  it('should izinkan akses jika tidak ada @Roles decorator', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = createMockExecutionContext({ role: Role.VIEWER });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should izinkan akses jika @Roles array kosong', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
    const ctx = createMockExecutionContext({ role: Role.VIEWER });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  // ─── Role hierarchy: OWNER > ADMIN > EDITOR > VIEWER ─────────────────────

  it('OWNER harus bisa akses endpoint yang butuh ADMIN', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const ctx = createMockExecutionContext({ role: Role.OWNER });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('OWNER harus bisa akses endpoint yang butuh EDITOR', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.EDITOR]);
    const ctx = createMockExecutionContext({ role: Role.OWNER });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('OWNER harus bisa akses endpoint yang butuh VIEWER', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.VIEWER]);
    const ctx = createMockExecutionContext({ role: Role.OWNER });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('ADMIN harus bisa akses endpoint yang butuh EDITOR', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.EDITOR]);
    const ctx = createMockExecutionContext({ role: Role.ADMIN });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('EDITOR tidak boleh akses endpoint yang butuh ADMIN', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const ctx = createMockExecutionContext({ role: Role.EDITOR });

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('VIEWER tidak boleh akses endpoint yang butuh EDITOR', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.EDITOR]);
    const ctx = createMockExecutionContext({ role: Role.VIEWER });

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('VIEWER tidak boleh akses endpoint yang butuh OWNER', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.OWNER]);
    const ctx = createMockExecutionContext({ role: Role.VIEWER });

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  // ─── Multiple roles ───────────────────────────────────────────────────────

  it('VIEWER bisa akses jika role VIEWER atau EDITOR sama-sama diizinkan', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.VIEWER, Role.EDITOR]);
    const ctx = createMockExecutionContext({ role: Role.VIEWER });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('EDITOR bisa akses jika role ADMIN atau EDITOR sama-sama diizinkan', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN, Role.EDITOR]);
    const ctx = createMockExecutionContext({ role: Role.EDITOR });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  // ─── Edge cases ───────────────────────────────────────────────────────────

  it('should throw ForbiddenException jika user tidak memiliki role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const ctx = createMockExecutionContext({ id: '1' }); // tanpa role

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException jika user object null', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const ctx = createMockExecutionContext(null);

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
