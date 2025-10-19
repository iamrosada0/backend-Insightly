// src/auth/auth.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    const registerDto: RegisterDto = {
      name: 'João Silva',
      username: 'joao_silva',
      email: 'joao@example.com',
      password: 'password123',
    };

    it('should successfully register a user and return user data without password (201)', async () => {
      const userResponse = {
        id: 1,
        name: registerDto.name,
        username: registerDto.username,
        email: registerDto.email,
      };
      mockAuthService.register.mockResolvedValue(userResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual(userResponse);
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect(mockAuthService.register).toHaveBeenCalledTimes(1);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw ConflictException if email or username already exists (409)', async () => {
      mockAuthService.register.mockRejectedValue(
        new ConflictException('Email or username already exists'),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        new ConflictException('Email or username already exists'),
      );
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect(mockAuthService.register).toHaveBeenCalledTimes(1);
    });

    it('should handle invalid RegisterDto and throw validation error', async () => {
      const invalidDto = { ...registerDto, email: 'invalid-email' }; // Invalid email
      mockAuthService.register.mockRejectedValue(
        new ConflictException('Validation failed'),
      );

      await expect(
        controller.register(invalidDto as RegisterDto),
      ).rejects.toThrow('Validation failed');
      expect(mockAuthService.register).toHaveBeenCalledWith(invalidDto);
    });
  });

  describe('POST /auth/login', () => {
    const loginDto: LoginDto = {
      email: 'joao@example.com',
      password: 'password123',
    };

    it('should successfully log in a user and return token and user data without password (200)', async () => {
      const loginResponse = {
        token: 'jwt-token',
        user: {
          id: 1,
          name: 'João Silva',
          username: 'joao_silva',
          email: loginDto.email,
        },
      };
      mockAuthService.login.mockResolvedValue(loginResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(loginResponse);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(mockAuthService.login).toHaveBeenCalledTimes(1);
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException if credentials are invalid (401)', async () => {
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(mockAuthService.login).toHaveBeenCalledTimes(1);
    });

    it('should handle invalid LoginDto and throw validation error', async () => {
      const invalidDto = { ...loginDto, email: 'invalid-email' }; // Invalid email
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Validation failed'),
      );

      await expect(controller.login(invalidDto as LoginDto)).rejects.toThrow(
        'Validation failed',
      );
      expect(mockAuthService.login).toHaveBeenCalledWith(invalidDto);
    });
  });
});
