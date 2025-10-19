import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { AuthGuard } from '@nestjs/passport';
import {
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

type FeedbackResponse = Array<{
  id: number;
  text: string;
  userId: number;
  createdAt: Date;
}>;

interface MockFeedbackService {
  createFeedback: jest.Mock<Promise<unknown>, [string, CreateFeedbackDto]>;
  getFeedbacks: jest.Mock<Promise<FeedbackResponse>, [number, number, number]>;
}

jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('FeedbackController', () => {
  let controller: FeedbackController;
  let mockFeedbackService: MockFeedbackService;

  beforeEach(async () => {
    mockFeedbackService = {
      createFeedback: jest.fn<
        ReturnType<MockFeedbackService['createFeedback']>,
        Parameters<MockFeedbackService['createFeedback']>
      >(),
      getFeedbacks: jest.fn<
        ReturnType<MockFeedbackService['getFeedbacks']>,
        Parameters<MockFeedbackService['getFeedbacks']>
      >(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedbackController],
      providers: [{ provide: FeedbackService, useValue: mockFeedbackService }],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({
        canActivate: jest.fn((context: ExecutionContext) => {
          const handler = context.getHandler().name;
          if (handler === 'createFeedback') {
            return true;
          }

          const request = context.switchToHttp().getRequest<RequestWithUser>();
          const token = request.headers?.authorization?.replace('Bearer ', '');

          if (!token) {
            throw new UnauthorizedException('User not authenticated');
          }

          if (!request.user) {
            throw new UnauthorizedException('User not authenticated');
          }

          return true;
        }),
      })
      .compile();

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
        text: createFeedbackDto.message,
        userId: 1,
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
      const invalidDto = { message: '' } as CreateFeedbackDto;
      mockFeedbackService.createFeedback.mockRejectedValue(
        new BadRequestException('Validation failed'),
      );

      await expect(
        controller.createFeedback(username, invalidDto),
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
    const jwtPayload: JwtPayload = {
      id: userId,
      email: 'joao@example.com',
      username: 'joao_silva',
    };
    const mockRequest: RequestWithUser = {
      user: jwtPayload,
      headers: { authorization: 'Bearer valid-token' },
      body: {},
      params: {},
      query: {},
      get: jest.fn(),
    } as unknown as RequestWithUser;

    it('should successfully retrieve feedbacks for the authenticated user (200)', async () => {
      const feedbacksResponse: FeedbackResponse = [
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
      mockFeedbackService.getFeedbacks.mockResolvedValue(feedbacksResponse);

      const result = await controller.getFeedbacks(mockRequest, '2', '5');

      expect(result).toEqual(feedbacksResponse);
      expect(mockFeedbackService.getFeedbacks).toHaveBeenCalledWith(
        userId,
        2,
        5,
      );
      expect(mockFeedbackService.getFeedbacks).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(Array);
      result.forEach((item) => {
        expect(item).toHaveProperty('text');
        expect(item.createdAt).toBeInstanceOf(Date);
        expect(item).toHaveProperty('userId', userId);
      });
    });

    it('should use default pagination values if query params are not provided', async () => {
      const feedbacksResponse: FeedbackResponse = [
        {
          id: 1,
          text: 'Great content, keep it up!',
          userId,
          createdAt: new Date(),
        },
      ];
      mockFeedbackService.getFeedbacks.mockResolvedValue(feedbacksResponse);

      const result = await controller.getFeedbacks(
        mockRequest,
        undefined,
        undefined,
      );

      expect(result).toEqual(feedbacksResponse);
      expect(mockFeedbackService.getFeedbacks).toHaveBeenCalledWith(
        userId,
        1,
        10,
      );
      expect(mockFeedbackService.getFeedbacks).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(Array);
      result.forEach((item) => {
        expect(item).toHaveProperty('text');
        expect(item.createdAt).toBeInstanceOf(Date);
        expect(item).toHaveProperty('userId', userId);
      });
    });

    it('should throw UnauthorizedException if user is not authenticated (401)', async () => {
      const unauthorizedRequest: RequestWithUser = {
        user: null,
        headers: {},
        body: {},
        params: {},
        query: {},
        get: jest.fn(),
      } as unknown as RequestWithUser;

      await expect(
        controller.getFeedbacks(unauthorizedRequest, undefined, undefined),
      ).rejects.toThrow(new UnauthorizedException('User not authenticated'));
      expect(mockFeedbackService.getFeedbacks).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if token is invalid (401)', async () => {
      const unauthorizedRequest: RequestWithUser = {
        user: null,
        headers: { authorization: 'Bearer invalid-token' },
        body: {},
        params: {},
        query: {},
        get: jest.fn(),
      } as unknown as RequestWithUser;

      await expect(
        controller.getFeedbacks(unauthorizedRequest, undefined, undefined),
      ).rejects.toThrow(new UnauthorizedException('User not authenticated'));
      expect(mockFeedbackService.getFeedbacks).not.toHaveBeenCalled();
    });

    it('should handle invalid pagination parameters and throw BadRequestException (400)', async () => {
      const invalidPage = 'invalid';
      mockFeedbackService.getFeedbacks.mockRejectedValue(
        new BadRequestException('Invalid pagination parameters'),
      );

      await expect(
        controller.getFeedbacks(mockRequest, invalidPage, '5'),
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
