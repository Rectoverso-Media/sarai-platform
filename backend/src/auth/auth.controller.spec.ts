import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BadRequestException } from '@nestjs/common';


const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  validateGoogleUser: jest.fn(),
  verifyEmail: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  acceptInvite: jest.fn(),
  refreshToken: jest.fn(),
  logout: jest.fn(),
  enable2FA: jest.fn(),
  verify2FA: jest.fn(),
  loginWith2FA: jest.fn(),
  disable2FA: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('register() — should delegate ke authService.register()', async () => {
    const dto = { name: 'Test', email: 'test@example.com', password: 'Pass123!' };
    mockAuthService.register.mockResolvedValue({ message: 'OK' });

    const result = await controller.register(dto);

    expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ message: 'OK' });
  });

  it('login() — should delegate ke authService.login()', async () => {
    const dto = { email: 'test@example.com', password: 'Pass123!' };
    mockAuthService.login.mockResolvedValue({ access_token: 'jwt' });

    const result = await controller.login(dto);

    expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ access_token: 'jwt' });
  });

  it('forgotPassword() — should delegate ke authService.forgotPassword()', async () => {
    mockAuthService.forgotPassword.mockResolvedValue({ message: 'Jika email terdaftar' });

    const result = await controller.forgotPassword('test@example.com');

    expect(mockAuthService.forgotPassword).toHaveBeenCalledWith('test@example.com');
  });

  it('refresh() — should throw BadRequestException jika refresh_token kosong', async () => {
    await expect(controller.refresh('')).rejects.toThrow(BadRequestException);
    expect(mockAuthService.refreshToken).not.toHaveBeenCalled();
  });

  it('loginWith2FA() — should throw BadRequestException jika body tidak lengkap', async () => {
    await expect(controller.loginWith2FA({ tempToken: '', code: '' })).rejects.toThrow(
      BadRequestException,
    );
  });
});
