import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

interface MockPrismaService {
  user: {
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
  };
}

interface MockJwtService {
  sign: jest.Mock;
}

describe('AuthService', () => {
  let service: AuthService;
  let mockPrismaService: MockPrismaService;
  let mockJwtService: MockJwtService;

  beforeEach(async () => {
    mockPrismaService = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@kabir.com',
      username: 'testuser',
      password: 'password',
      name: 'Test User',
    };
    const user = {
      id: 1,
      email: registerDto.email,
      username: registerDto.username,
      name: registerDto.name,
    };
    const hashedPassword = 'hashedPassword';
    const token = 'jwt-token';

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(user);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('Email ou nome de usuário já existente'),
      );
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: registerDto.email },
            { username: registerDto.username },
          ],
        },
      });
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if username already exists', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(user);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('Email ou nome de usuário já existente'),
      );
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: registerDto.email },
            { username: registerDto.username },
          ],
        },
      });
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('should successfully register a new user and return token', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrismaService.user.create.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.register(registerDto);

      expect(result).toEqual({
        message: 'Usuário registrado com sucesso',
        accessToken: token,
        user,
      });
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: registerDto.email },
            { username: registerDto.username },
          ],
        },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: registerDto.email,
          username: registerDto.username,
          password: hashedPassword,
          name: registerDto.name,
        },
        select: { id: true, email: true, username: true, name: true },
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
      });
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@kabir.com',
      password: 'password',
    };
    const user = {
      id: 1,
      email: loginDto.email,
      username: 'testuser',
      password: 'hashedPassword',
      name: 'Test User',
    };
    const token = 'jwt-token';

    it('should successfully log in a user and return token and user data', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        accessToken: token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
        },
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
        select: {
          id: true,
          email: true,
          username: true,
          password: true,
          name: true,
        },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        user.password,
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
      });
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Credenciais inválidas'),
      );
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
        select: {
          id: true,
          email: true,
          username: true,
          password: true,
          name: true,
        },
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Credenciais inválidas'),
      );
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
        select: {
          id: true,
          email: true,
          username: true,
          password: true,
          name: true,
        },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        user.password,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user data for a valid user ID', async () => {
      const userId = 1;
      const user = {
        id: userId,
        email: 'test@kabir.com',
        username: 'testuser',
        name: 'Test User',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.validateUser(userId);

      expect(result).toEqual(user);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { id: true, email: true, username: true, name: true },
      });
    });

    it('should return null for an invalid user ID', async () => {
      const userId = 999;
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser(userId);

      expect(result).toBeNull();
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { id: true, email: true, username: true, name: true },
      });
    });
  });
});
