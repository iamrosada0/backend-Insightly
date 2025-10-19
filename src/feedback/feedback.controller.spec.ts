// src/feedback/feedback.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { AuthGuard } from '@nestjs/passport';
import {
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface';

describe('FeedbackController', () => {
  let controller: FeedbackController;

  const mockFeedbackService = {
    createFeedback: jest.fn(),
    getFeedbacks: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedbackController],
      providers: [
        {
          provide: FeedbackService,
          useValue: mockFeedbackService,
        },
        {
          provide: AuthGuard('jwt'),
          useValue: mockAuthGuard,
        },
      ],
    }).compile();

    controller = module.get<FeedbackController>(FeedbackController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /feedback/:username', () => {
    const username = 'joao_silva';
    const createFeedbackDto: CreateFeedbackDto = {
      message: 'Great content, keep it up!',
    };

    it('should successfully submit feedback for a user (201)', async () => {
      const feedbackResponse = {
        id: 1,
        message: createFeedbackDto.message,
        receiverId: 1,
        createdAt: new Date(),
      };
      mockFeedbackService.createFeedback.mockResolvedValue(feedbackResponse);

      const result = await controller.createFeedback(
        username,
        createFeedbackDto,
      );

      expect(result).toEqual(feedbackResponse);
      expect(mockFeedbackService.createFeedback).toHaveBeenCalledWith(
        username,
        createFeedbackDto,
      );
      expect(mockFeedbackService.createFeedback).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if user does not exist (404)', async () => {
      mockFeedbackService.createFeedback.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.createFeedback(username, createFeedbackDto),
      ).rejects.toThrow(new NotFoundException('User not found'));
      expect(mockFeedbackService.createFeedback).toHaveBeenCalledWith(
        username,
        createFeedbackDto,
      );
      expect(mockFeedbackService.createFeedback).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException for invalid CreateFeedbackDto (400)', async () => {
      const invalidDto = { message: '' }; // Empty message
      mockFeedbackService.createFeedback.mockRejectedValue(
        new BadRequestException('Validation failed'),
      );

      await expect(
        controller.createFeedback(username, invalidDto as CreateFeedbackDto),
      ).rejects.toThrow(new BadRequestException('Validation failed'));
      expect(mockFeedbackService.createFeedback).toHaveBeenCalledWith(
        username,
        invalidDto,
      );
      expect(mockFeedbackService.createFeedback).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /feedback', () => {
    const userId = 1;
    const mockRequest: RequestWithUser = {
      user: { id: userId, email: 'joao@example.com' },
    } as RequestWithUser;
    const page = '2';
    const limit = '5';

    it('should successfully retrieve feedbacks for the authenticated user (200)', async () => {
      const feedbacksResponse = {
        data: [
          {
            id: 1,
            message: 'Great content, keep it up!',
            receiverId: userId,
            createdAt: new Date(),
          },
          {
            id: 2,
            message: 'Nice job!',
            receiverId: userId,
            createdAt: new Date(),
          },
        ],
        total: 2,
        page: 2,
        limit: 5,
      };
      mockFeedbackService.getFeedbacks.mockResolvedValue(feedbacksResponse);

      const result = await controller.getFeedbacks(mockRequest, page, limit);

      expect(result).toEqual(feedbacksResponse);
      expect(mockFeedbackService.getFeedbacks).toHaveBeenCalledWith(
        userId,
        2,
        5,
      );
      expect(mockFeedbackService.getFeedbacks).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(Array);
      if (result.length > 0) {
        // Itera sobre cada item em result
        result.forEach((item) => {
          expect(item).toHaveProperty('message');
          expect(item.createdAt).toBeInstanceOf(Date);
          expect(item).toHaveProperty('receiverId', userId);
        });
      }

      expect(result).toHaveProperty('total', 2);
      expect(result).toHaveProperty('page', 2);
      expect(result).toHaveProperty('limit', 5);
    });

    it('should use default pagination values if query params are not provided', async () => {
      const feedbacksResponse = {
        data: [
          {
            id: 1,
            message: 'Great content, keep it up!',
            receiverId: userId,
            createdAt: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };
      mockFeedbackService.getFeedbacks.mockResolvedValue(feedbacksResponse);

      const result = await controller.getFeedbacks(mockRequest, page, limit);

      expect(result).toEqual(feedbacksResponse);
      expect(mockFeedbackService.getFeedbacks).toHaveBeenCalledWith(
        userId,
        1,
        10,
      );
      expect(mockFeedbackService.getFeedbacks).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(Array);
      if (result.length > 0) {
        // Itera sobre cada item em result
        result.forEach((item) => {
          expect(item).toHaveProperty('message');
          expect(item.createdAt).toBeInstanceOf(Date);
          expect(item).toHaveProperty('receiverId', userId);
        });
      }

      expect(result).toHaveProperty('total', 1);
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('limit', 10);
    });

    it('should throw UnauthorizedException if user is not authenticated (401)', async () => {
      mockAuthGuard.canActivate.mockReturnValue(false); // Simulate unauthenticated user

      await expect(
        controller.getFeedbacks(mockRequest, page, limit),
      ).rejects.toThrow(new UnauthorizedException());
      expect(mockFeedbackService.getFeedbacks).not.toHaveBeenCalled();
    });

    it('should handle invalid pagination parameters and throw BadRequestException (400)', async () => {
      const invalidPage = 'invalid'; // Non-numeric page
      mockFeedbackService.getFeedbacks.mockRejectedValue(
        new BadRequestException('Invalid pagination parameters'),
      );

      await expect(
        controller.getFeedbacks(mockRequest, invalidPage, limit),
      ).rejects.toThrow(
        new BadRequestException('Invalid pagination parameters'),
      );
      expect(mockFeedbackService.getFeedbacks).toHaveBeenCalledWith(
        userId,
        NaN,
        5,
      );
      expect(mockFeedbackService.getFeedbacks).toHaveBeenCalledTimes(1);
    });
  });
});
