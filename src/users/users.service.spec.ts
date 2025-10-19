import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateLinkDto } from './dto/create-link.dto';
import { UpdateLinkDto } from './dto/update-link.dto';

// Define mock type for PrismaService
interface MockPrismaService {
  user: {
    update: jest.Mock;
    findUnique: jest.Mock;
    findMany: jest.Mock;
  };
  link: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
}

// Mock console.log and console.error to avoid cluttering test output
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('UsersService', () => {
  let service: UsersService;
  let mockPrismaService: MockPrismaService;

  beforeEach(async () => {
    mockPrismaService = {
      user: {
        update: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      link: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateProfile', () => {
    const userId = 1;
    const updateProfileDto: UpdateProfileDto = {
      name: 'Updated Name',
      bio: 'Updated Bio',
    };
    const updatedUser = {
      id: userId,
      email: 'test@example.com',
      username: 'testuser',
      name: updateProfileDto.name,
      bio: updateProfileDto.bio,
    };

    it('should throw BadRequestException if userId is not provided', async () => {
      await expect(service.updateProfile(0, updateProfileDto)).rejects.toThrow(
        new BadRequestException('User ID is required'),
      );
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('should update user profile and return updated user', async () => {
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(userId, updateProfileDto);

      expect(result).toEqual(updatedUser);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateProfileDto,
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          bio: true,
        },
      });
    });

    it('should throw BadRequestException on Prisma error', async () => {
      mockPrismaService.user.update.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.updateProfile(userId, updateProfileDto),
      ).rejects.toThrow(new BadRequestException('Failed to update profile'));
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateProfileDto,
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          bio: true,
        },
      });
    });
  });

  describe('createLink', () => {
    const userId = 1;
    const createLinkDto: CreateLinkDto = {
      title: 'My Link',
      url: 'https://example.com',
    };
    const createdLink = {
      id: 1,
      title: createLinkDto.title,
      url: createLinkDto.url,
      userId,
      createdAt: new Date(),
    };

    it('should create a link and return it', async () => {
      mockPrismaService.link.create.mockResolvedValue(createdLink);

      const result = await service.createLink(userId, createLinkDto);

      expect(result).toEqual(createdLink);
      expect(mockPrismaService.link.create).toHaveBeenCalledWith({
        data: {
          title: createLinkDto.title,
          url: createLinkDto.url,
          userId,
        },
      });
    });
  });

  describe('getLinks', () => {
    const userId = 1;
    const links = [
      {
        id: 1,
        title: 'Link 1',
        url: 'https://example.com/1',
        userId,
        createdAt: new Date(),
      },
      {
        id: 2,
        title: 'Link 2',
        url: 'https://example.com/2',
        userId,
        createdAt: new Date(),
      },
    ];

    it('should return links for the user', async () => {
      mockPrismaService.link.findMany.mockResolvedValue(links);

      const result = await service.getLinks(userId);

      expect(result).toEqual(links);
      expect(mockPrismaService.link.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('updateLink', () => {
    const userId = 1;
    const linkId = 1;
    const updateLinkDto: UpdateLinkDto = {
      title: 'Updated Link',
      url: 'https://updated.com',
    };
    const link = {
      id: linkId,
      title: 'Old Link',
      url: 'https://old.com',
      userId,
    };

    it('should update a link and return it', async () => {
      const updatedLink = { ...link, ...updateLinkDto };
      mockPrismaService.link.findUnique.mockResolvedValue(link);
      mockPrismaService.link.update.mockResolvedValue(updatedLink);

      const result = await service.updateLink(userId, linkId, updateLinkDto);

      expect(result).toEqual(updatedLink);
      expect(mockPrismaService.link.findUnique).toHaveBeenCalledWith({
        where: { id: linkId },
      });
      expect(mockPrismaService.link.update).toHaveBeenCalledWith({
        where: { id: linkId },
        data: updateLinkDto,
      });
    });

    it('should throw NotFoundException if link does not exist', async () => {
      mockPrismaService.link.findUnique.mockResolvedValue(null);

      await expect(
        service.updateLink(userId, linkId, updateLinkDto),
      ).rejects.toThrow(
        new NotFoundException('Link not found or not authorized'),
      );
      expect(mockPrismaService.link.findUnique).toHaveBeenCalledWith({
        where: { id: linkId },
      });
      expect(mockPrismaService.link.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if user is not authorized', async () => {
      const unauthorizedLink = { ...link, userId: 2 };
      mockPrismaService.link.findUnique.mockResolvedValue(unauthorizedLink);

      await expect(
        service.updateLink(userId, linkId, updateLinkDto),
      ).rejects.toThrow(
        new NotFoundException('Link not found or not authorized'),
      );
      expect(mockPrismaService.link.findUnique).toHaveBeenCalledWith({
        where: { id: linkId },
      });
      expect(mockPrismaService.link.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteLink', () => {
    const userId = 1;
    const linkId = 1;
    const link = {
      id: linkId,
      title: 'Link',
      url: 'https://example.com',
      userId,
    };

    it('should delete a link and return it', async () => {
      mockPrismaService.link.findUnique.mockResolvedValue(link);
      mockPrismaService.link.delete.mockResolvedValue(link);

      const result = await service.deleteLink(userId, linkId);

      expect(result).toEqual(link);
      expect(mockPrismaService.link.findUnique).toHaveBeenCalledWith({
        where: { id: linkId },
      });
      expect(mockPrismaService.link.delete).toHaveBeenCalledWith({
        where: { id: linkId },
      });
    });

    it('should throw NotFoundException if link does not exist', async () => {
      mockPrismaService.link.findUnique.mockResolvedValue(null);

      await expect(service.deleteLink(userId, linkId)).rejects.toThrow(
        new NotFoundException('Link not found or not authorized'),
      );
      expect(mockPrismaService.link.findUnique).toHaveBeenCalledWith({
        where: { id: linkId },
      });
      expect(mockPrismaService.link.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if user is not authorized', async () => {
      const unauthorizedLink = { ...link, userId: 2 };
      mockPrismaService.link.findUnique.mockResolvedValue(unauthorizedLink);

      await expect(service.deleteLink(userId, linkId)).rejects.toThrow(
        new NotFoundException('Link not found or not authorized'),
      );
      expect(mockPrismaService.link.findUnique).toHaveBeenCalledWith({
        where: { id: linkId },
      });
      expect(mockPrismaService.link.delete).not.toHaveBeenCalled();
    });
  });

  describe('getPublicProfile', () => {
    const username = 'testuser';
    const user = {
      username,
      name: 'Test User',
      bio: 'Test Bio',
      links: [
        {
          id: 1,
          title: 'Link 1',
          url: 'https://example.com/1',
          createdAt: new Date(),
        },
      ],
    };

    it('should return public profile for a user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.getPublicProfile(username);

      expect(result).toEqual(user);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username },
        select: {
          username: true,
          name: true,
          bio: true,
          links: {
            orderBy: { createdAt: 'desc' },
            select: { id: true, title: true, url: true, createdAt: true },
          },
        },
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getPublicProfile(username)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username },
        select: {
          username: true,
          name: true,
          bio: true,
          links: {
            orderBy: { createdAt: 'desc' },
            select: { id: true, title: true, url: true, createdAt: true },
          },
        },
      });
    });
  });

  describe('findOne', () => {
    const userId = 1;
    const user = {
      id: userId,
      email: 'test@example.com',
      username: 'testuser',
      name: 'Test User',
      bio: 'Test Bio',
    };

    it('should return user data for a valid user ID', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.findOne(userId);

      expect(result).toEqual(user);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          bio: true,
        },
      });
    });

    it('should return null for an invalid user ID', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findOne(userId);

      expect(result).toBeNull();
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          bio: true,
        },
      });
    });
  });

  describe('getAllUsers', () => {
    const users = [
      { id: 1, username: 'testuser1', name: 'Test User 1' },
      { id: 2, username: 'testuser2', name: 'Test User 2' },
    ];

    it('should return all users', async () => {
      mockPrismaService.user.findMany.mockResolvedValue(users);

      const result = await service.getAllUsers();

      expect(result).toEqual(users);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        select: { id: true, username: true, name: true },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('getUserProfileById', () => {
    const userId = 1;
    const user = {
      username: 'testuser',
      name: 'Test User',
      bio: 'Test Bio',
      links: [
        {
          id: 1,
          title: 'Link 1',
          url: 'https://example.com/1',
          createdAt: new Date(),
        },
      ],
    };

    it('should return user profile for a valid user ID', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.getUserProfileById(userId);

      expect(result).toEqual(user);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          username: true,
          name: true,
          bio: true,
          links: {
            select: { id: true, title: true, url: true, createdAt: true },
          },
        },
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserProfileById(userId)).rejects.toThrow(
        new NotFoundException('user não encontrado'),
      );
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          username: true,
          name: true,
          bio: true,
          links: {
            select: { id: true, title: true, url: true, createdAt: true },
          },
        },
      });
    });
  });
});
