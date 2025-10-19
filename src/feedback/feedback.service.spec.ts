import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackService } from './feedback.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

interface MockPrismaService {
  user: {
    findUnique: jest.Mock;
  };
  feedback: {
    create: jest.Mock;
    findMany: jest.Mock;
  };
}

describe('FeedbackService', () => {
  let service: FeedbackService;
  let mockPrismaService: MockPrismaService;

  beforeEach(async () => {
    mockPrismaService = {
      user: {
        findUnique: jest.fn(),
      },
      feedback: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<FeedbackService>(FeedbackService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createFeedback', () => {
    const username = 'joao_silva';
    const createFeedbackDto: CreateFeedbackDto = {
      message: 'Great content, keep it up!',
    };

    it('should create and return feedback when user exists', async () => {
      const mockUser = { id: 1, username };
      const mockFeedback = {
        id: 1,
        text: createFeedbackDto.message,
        userId: mockUser.id,
        createdAt: new Date(),
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.feedback.create.mockResolvedValue(mockFeedback);

      const result = await service.createFeedback(username, createFeedbackDto);

      expect(result).toEqual(mockFeedback);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username },
      });
      expect(mockPrismaService.feedback.create).toHaveBeenCalledWith({
        data: {
          text: createFeedbackDto.message,
          userId: mockUser.id,
        },
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.feedback.create).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.createFeedback(username, createFeedbackDto),
      ).rejects.toThrow(new NotFoundException('User not found'));
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username },
      });
      expect(mockPrismaService.feedback.create).not.toHaveBeenCalled();
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('getFeedbacks', () => {
    const userId = 1;
    const mockFeedbacks = [
      {
        id: 1,
        text: 'Great content, keep it up!',
        userId,
        createdAt: new Date(),
      },
      {
        id: 2,
        text: 'Nice job!',
        userId,
        createdAt: new Date(),
      },
    ];

    it('should retrieve feedbacks with custom pagination', async () => {
      const page = 2;
      const limit = 5;
      mockPrismaService.feedback.findMany.mockResolvedValue(mockFeedbacks);

      const result = await service.getFeedbacks(userId, page, limit);

      expect(result).toEqual(mockFeedbacks);
      expect(mockPrismaService.feedback.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });
      expect(mockPrismaService.feedback.findMany).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(Array);
      result.forEach((item) => {
        expect(item).toHaveProperty('text');
        expect(item.createdAt).toBeInstanceOf(Date);
        expect(item).toHaveProperty('userId', userId);
      });
    });

    it('should retrieve feedbacks with default pagination', async () => {
      mockPrismaService.feedback.findMany.mockResolvedValue(mockFeedbacks);

      const result = await service.getFeedbacks(userId);

      expect(result).toEqual(mockFeedbacks);
      expect(mockPrismaService.feedback.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
      expect(mockPrismaService.feedback.findMany).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(Array);
      result.forEach((item) => {
        expect(item).toHaveProperty('text');
        expect(item.createdAt).toBeInstanceOf(Date);
        expect(item).toHaveProperty('userId', userId);
      });
    });

    it('should return empty array when no feedbacks are found', async () => {
      mockPrismaService.feedback.findMany.mockResolvedValue([]);

      const result = await service.getFeedbacks(userId, 1, 10);

      expect(result).toEqual([]);
      expect(mockPrismaService.feedback.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
      expect(mockPrismaService.feedback.findMany).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(0);
    });

    it('should handle negative pagination parameters gracefully', async () => {
      const page = -1;
      const limit = -5;
      mockPrismaService.feedback.findMany.mockResolvedValue([]);

      const result = await service.getFeedbacks(userId, page, limit);

      expect(result).toEqual([]);
      expect(mockPrismaService.feedback.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (-1 - 1) * -5,
        take: -5,
      });
      expect(mockPrismaService.feedback.findMany).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(Array);
    });
  });
});
