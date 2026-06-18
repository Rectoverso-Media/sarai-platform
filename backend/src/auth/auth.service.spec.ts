import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';

// ─── Mock Dependencies ────────────────────────────────────────────────────────

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
  },
  userSession: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    update: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn(),
};

const mockEmailService = {
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendResetPasswordEmail: jest.fn().mockResolvedValue(undefined),
};

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Reset semua mock sebelum setiap test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── register() ───────────────────────────────────────────────────────────

  describe('register()', () => {
    const registerDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should throw BadRequestException jika email sudah terdaftar', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: '1', email: registerDto.email });

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
      await expect(service.register(registerDto)).rejects.toThrow('Email sudah terdaftar!');
    });

    it('should berhasil register user baru dan kirim email verifikasi', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'new-user-id',
        name: registerDto.name,
        email: registerDto.email,
        password: 'hashed-password',
        twoFactorSecret: null,
        isEmailVerified: false,
      });

      const result = await service.register(registerDto);

      expect(mockPrismaService.user.create).toHaveBeenCalledTimes(1);
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        registerDto.email,
        'mock-jwt-token',
      );
      expect(result.message).toContain('Registrasi sukses');
      // Pastikan password TIDAK dikembalikan ke client
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('twoFactorSecret');
    });

    it('should hash password sebelum disimpan ke database', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'new-id',
        name: registerDto.name,
        email: registerDto.email,
        password: 'hashed',
        twoFactorSecret: null,
      });

      await service.register(registerDto);

      const createCall = mockPrismaService.user.create.mock.calls[0][0];
      const savedPassword = createCall.data.password;
      // Password yang disimpan harus berbeda dari plain text
      expect(savedPassword).not.toBe(registerDto.password);
      // Dan harus bisa diverifikasi dengan bcrypt
      const isHashed = await bcrypt.compare(registerDto.password, savedPassword);
      expect(isHashed).toBe(true);
    });
  });

  // ─── login() ──────────────────────────────────────────────────────────────

  describe('login()', () => {
    const loginDto = { email: 'test@example.com', password: 'Password123!' };
    const hashedPassword = bcrypt.hashSync('Password123!', 10);

    it('should throw UnauthorizedException jika user tidak ditemukan', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException jika password salah', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: loginDto.email,
        password: hashedPassword,
        isEmailVerified: true,
        isTwoFactorEnabled: false,
      });

      await expect(service.login({ ...loginDto, password: 'WrongPassword!' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException jika email belum diverifikasi', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: loginDto.email,
        password: hashedPassword,
        isEmailVerified: false, // ← belum verifikasi
        isTwoFactorEnabled: false,
      });

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('belum diverifikasi');
    });

    it('should return requires2FA=true jika 2FA aktif', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: loginDto.email,
        password: hashedPassword,
        isEmailVerified: true,
        isTwoFactorEnabled: true, // ← 2FA aktif
      });
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.login(loginDto) as any;

      expect(result.requires2FA).toBe(true);
      expect(result.tempToken).toBe('mock-jwt-token');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ twoFactorTempToken: 'mock-jwt-token' }) }),
      );
    });

    it('should return access_token dan refresh_token untuk login normal', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: loginDto.email,
        password: hashedPassword,
        isEmailVerified: true,
        isTwoFactorEnabled: false,
        role: 'VIEWER',
        name: 'Test',
        twoFactorSecret: null,
        twoFactorTempToken: null,
      });
      mockPrismaService.userSession.create.mockResolvedValue({ id: 'session-1' });

      const result = await service.login(loginDto) as any;

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result.user).not.toHaveProperty('password');
    });
  });

  // ─── verifyEmail() ────────────────────────────────────────────────────────

  describe('verifyEmail()', () => {
    it('should throw BadRequestException jika token tidak valid', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException jika purpose token bukan email_verification', async () => {
      mockJwtService.verify.mockReturnValue({ email: 'test@example.com', purpose: 'reset_password' });

      await expect(service.verifyEmail('wrong-purpose-token')).rejects.toThrow(BadRequestException);
    });

    it('should update isEmailVerified=true jika token valid', async () => {
      mockJwtService.verify.mockReturnValue({ email: 'test@example.com', purpose: 'email_verification' });
      mockPrismaService.user.update.mockResolvedValue({ isEmailVerified: true });

      const result = await service.verifyEmail('valid-token');

      expect(result).toBe(true);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isEmailVerified: true } }),
      );
    });
  });

  // ─── forgotPassword() ─────────────────────────────────────────────────────

  describe('forgotPassword()', () => {
    it('should return pesan generic jika email tidak terdaftar (cegah user enumeration)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword('nonexistent@example.com');

      // Pesan harus sama — jangan reveal apakah email terdaftar atau tidak
      expect(result.message).toContain('Jika email terdaftar');
      // Tidak boleh kirim email
      expect(mockEmailService.sendResetPasswordEmail).not.toHaveBeenCalled();
    });

    it('should kirim email reset jika email ditemukan', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: '1', email: 'found@example.com' });

      const result = await service.forgotPassword('found@example.com');

      expect(result.message).toContain('Jika email terdaftar');
      expect(mockEmailService.sendResetPasswordEmail).toHaveBeenCalledTimes(1);
    });
  });

  // ─── refreshToken() ───────────────────────────────────────────────────────

  describe('refreshToken()', () => {
    it('should throw UnauthorizedException jika refresh token tidak ditemukan', async () => {
      mockPrismaService.userSession.findUnique.mockResolvedValue(null);

      await expect(service.refreshToken('invalid-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException dan hapus session jika token expired', async () => {
      const expiredDate = new Date(Date.now() - 1000); // 1 detik yang lalu
      mockPrismaService.userSession.findUnique.mockResolvedValue({
        id: 'session-1',
        expiresAt: expiredDate,
        user: { id: '1', email: 'test@example.com', role: 'VIEWER', name: 'Test' },
      });

      await expect(service.refreshToken('expired-token')).rejects.toThrow(UnauthorizedException);
      expect(mockPrismaService.userSession.delete).toHaveBeenCalledWith({ where: { id: 'session-1' } });
    });

    it('should rotate refresh token dan return new access_token', async () => {
      const futureDate = new Date(Date.now() + 86400000); // besok
      mockPrismaService.userSession.findUnique.mockResolvedValue({
        id: 'session-1',
        expiresAt: futureDate,
        user: { id: '1', email: 'test@example.com', role: 'VIEWER', name: 'Test' },
      });
      mockPrismaService.userSession.update.mockResolvedValue({});

      const result = await service.refreshToken('valid-refresh-token');

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      // Refresh token harus dirotate (berbeda dari yang lama)
      expect(result.refresh_token).not.toBe('valid-refresh-token');
      expect(mockPrismaService.userSession.update).toHaveBeenCalledTimes(1);
    });
  });

  // ─── logout() ─────────────────────────────────────────────────────────────

  describe('logout()', () => {
    it('should hapus hanya sesi tertentu jika refresh_token diberikan', async () => {
      mockPrismaService.userSession.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.logout('user-1', 'specific-refresh-token');

      expect(result.message).toBe('Logout berhasil.');
      expect(mockPrismaService.userSession.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1', refreshToken: 'specific-refresh-token' } }),
      );
    });

    it('should hapus SEMUA sesi jika refresh_token tidak diberikan (logout semua device)', async () => {
      mockPrismaService.userSession.deleteMany.mockResolvedValue({ count: 3 });

      await service.logout('user-1'); // tanpa refresh token

      expect(mockPrismaService.userSession.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
    });
  });

  // ─── enable2FA() ──────────────────────────────────────────────────────────

  describe('enable2FA()', () => {
    it('should throw BadRequestException jika user tidak ditemukan', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.enable2FA('non-existent-id')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException jika 2FA sudah aktif', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        isTwoFactorEnabled: true, // sudah aktif
      });

      await expect(service.enable2FA('user-1')).rejects.toThrow('2FA sudah aktif');
    });

    it('should generate secret dan QR code jika 2FA belum aktif', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        isTwoFactorEnabled: false,
      });
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.enable2FA('user-1');

      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('qrCode');
      expect(result.qrCode).toMatch(/^data:image\/png;base64,/);
    });
  });

  // ─── loginWith2FA() ───────────────────────────────────────────────────────

  describe('loginWith2FA()', () => {
    it('should throw UnauthorizedException jika tempToken tidak valid (expired/invalid)', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.loginWith2FA('expired-temp-token', '123456')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw BadRequestException jika purpose bukan 2fa_verification', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-1', purpose: 'wrong_purpose' });

      await expect(service.loginWith2FA('wrong-purpose-token', '123456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException jika tempToken di DB tidak cocok', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-1', purpose: '2fa_verification' });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        twoFactorTempToken: 'different-token', // Tidak cocok
        twoFactorSecret: 'some-secret',
        isTwoFactorEnabled: true,
      });

      await expect(service.loginWith2FA('incoming-temp-token', '123456')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
