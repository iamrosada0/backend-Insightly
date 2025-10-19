import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateLinkDto } from './dto/create-link.dto';
import { UpdateLinkDto } from './dto/update-link.dto';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

interface MockUsersService {
  updateProfile: jest.Mock;
  createLink: jest.Mock;
  getLinks: jest.Mock;
  updateLink: jest.Mock;
  deleteLink: jest.Mock;
  getPublicProfile: jest.Mock;
  getAllUsers: jest.Mock;
  getUserProfileById: jest.Mock;
}

jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('UsersController', () => {
  let controller: UsersController;
  let mockUsersService: MockUsersService;

  beforeEach(async () => {
    mockUsersService = {
      updateProfile: jest.fn(),
      createLink: jest.fn(),
      getLinks: jest.fn(),
      updateLink: jest.fn(),
      deleteLink: jest.fn(),
      getPublicProfile: jest.fn(),
      getAllUsers: jest.fn(),
      getUserProfileById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({
        canActivate: jest.fn((context: ExecutionContext) => {
          const handler = context.getHandler().name;

          if (handler === 'getPublicProfile' || handler === 'getAllUsers') {
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

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateProfile', () => {
    const userId = 1;
    const jwtPayload: JwtPayload = {
      id: userId,
      username: 'testuser',
      email: 'test@kabir.com',
    };
    const mockRequest: RequestWithUser = {
      user: jwtPayload,
      headers: { authorization: 'Bearer valid-token' },
      body: {},
      params: {},
      query: {},
      get: jest.fn(),
    } as unknown as RequestWithUser;
    const updateProfileDto: UpdateProfileDto = {
      name: 'Updated Name',
      bio: 'Updated Bio',
    };
    const updatedUser = {
      id: userId,
      email: 'test@kabir.com',
      username: 'testuser',
      name: updateProfileDto.name,
      bio: updateProfileDto.bio,
    };

    it('should update profile and return updated user', async () => {
      mockUsersService.updateProfile.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(
        mockRequest,
        updateProfileDto,
      );

      expect(result).toEqual(updatedUser);
      expect(mockUsersService.updateProfile).toHaveBeenCalledWith(
        userId,
        updateProfileDto,
      );
    });

    it('should throw UnauthorizedException if no token is provided', async () => {
      const unauthorizedRequest: RequestWithUser = {
        user: null,
        headers: {},
        body: {},
        params: {},
        query: {},
        get: jest.fn(),
      } as unknown as RequestWithUser;

      await expect(
        controller.updateProfile(unauthorizedRequest, updateProfileDto),
      ).rejects.toThrow(new UnauthorizedException('User not authenticated'));
      expect(mockUsersService.updateProfile).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      const unauthorizedRequest: RequestWithUser = {
        user: null,
        headers: { authorization: 'Bearer invalid-token' },
        body: {},
        params: {},
        query: {},
        get: jest.fn(),
      } as unknown as RequestWithUser;

      await expect(
        controller.updateProfile(unauthorizedRequest, updateProfileDto),
      ).rejects.toThrow(new UnauthorizedException('User not authenticated'));
      expect(mockUsersService.updateProfile).not.toHaveBeenCalled();
    });

    it('should propagate BadRequestException from service', async () => {
      mockUsersService.updateProfile.mockRejectedValue(
        new BadRequestException('User ID is required'),
      );

      await expect(
        controller.updateProfile(mockRequest, updateProfileDto),
      ).rejects.toThrow(BadRequestException);
      expect(mockUsersService.updateProfile).toHaveBeenCalledWith(
        userId,
        updateProfileDto,
      );
    });

    it('should log user ID during profile update', async () => {
      mockUsersService.updateProfile.mockResolvedValue(updatedUser);
      const consoleLogSpy = jest.spyOn(console, 'log');

      await controller.updateProfile(mockRequest, updateProfileDto);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Update profile request for user ID:',
        mockRequest.user,
      );
      consoleLogSpy.mockRestore();
    });
  });

  describe('createLink', () => {
    const userId = 1;
    const jwtPayload: JwtPayload = {
      id: userId,
      username: 'testuser',
      email: 'test@kabir.com',
    };
    const mockRequest: RequestWithUser = {
      user: jwtPayload,
      headers: { authorization: 'Bearer valid-token' },
      body: {},
      params: {},
      query: {},
      get: jest.fn(),
    } as unknown as RequestWithUser;
    const createLinkDto: CreateLinkDto = {
      title: 'My Link',
      url: 'https://kabir.com',
    };
    const createdLink = {
      id: 1,
      title: createLinkDto.title,
      url: createLinkDto.url,
      userId,
      createdAt: new Date(),
    };

    it('should create a link and return it', async () => {
      mockUsersService.createLink.mockResolvedValue(createdLink);

      const result = await controller.createLink(mockRequest, createLinkDto);

      expect(result).toEqual(createdLink);
      expect(mockUsersService.createLink).toHaveBeenCalledWith(
        userId,
        createLinkDto,
      );
    });

    it('should throw UnauthorizedException if no token is provided', async () => {
      const unauthorizedRequest: RequestWithUser = {
        user: null,
        headers: {},
        body: {},
        params: {},
        query: {},
        get: jest.fn(),
      } as unknown as RequestWithUser;

      await expect(
        controller.createLink(unauthorizedRequest, createLinkDto),
      ).rejects.toThrow(new UnauthorizedException('User not authenticated'));
      expect(mockUsersService.createLink).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      const unauthorizedRequest: RequestWithUser = {
        user: null,
        headers: { authorization: 'Bearer invalid-token' },
        body: {},
        params: {},
        query: {},
        get: jest.fn(),
      } as unknown as RequestWithUser;

      await expect(
        controller.createLink(unauthorizedRequest, createLinkDto),
      ).rejects.toThrow(new UnauthorizedException('User not authenticated'));
      expect(mockUsersService.createLink).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid URL', async () => {
      const invalidCreateLinkDto: CreateLinkDto = {
        title: 'Invalid Link',
        url: 'not-a-url',
      };
      mockUsersService.createLink.mockRejectedValue(
        new BadRequestException('Validation failed'),
      );

      await expect(
        controller.createLink(mockRequest, invalidCreateLinkDto),
      ).rejects.toThrow(BadRequestException);
      expect(mockUsersService.createLink).toHaveBeenCalledWith(
        userId,
        invalidCreateLinkDto,
      );
    });
  });

  describe('getLinks', () => {
    const userId = 1;
    const jwtPayload: JwtPayload = {
      id: userId,
      username: 'testuser',
      email: 'test@kabir.com',
    };
    const mockRequest: RequestWithUser = {
      user: jwtPayload,
      headers: { authorization: 'Bearer valid-token' },
      body: {},
      params: {},
      query: {},
      get: jest.fn(),
    } as unknown as RequestWithUser;
    const links = [
      {
        id: 1,
        title: 'Link 1',
        url: 'https://kabir.com/1',
        userId,
        createdAt: new Date(),
      },
    ];

    it('should return user links', async () => {
      mockUsersService.getLinks.mockResolvedValue(links);

      const result = await controller.getLinks(mockRequest);

      expect(result).toEqual(links);
      expect(mockUsersService.getLinks).toHaveBeenCalledWith(userId);
    });

    it('should throw UnauthorizedException if no token is provided', async () => {
      const unauthorizedRequest: RequestWithUser = {
        user: null,
        headers: {},
        body: {},
        params: {},
        query: {},
        get: jest.fn(),
      } as unknown as RequestWithUser;

      await expect(controller.getLinks(unauthorizedRequest)).rejects.toThrow(
        new UnauthorizedException('User not authenticated'),
      );
      expect(mockUsersService.getLinks).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      const unauthorizedRequest: RequestWithUser = {
        user: null,
        headers: { authorization: 'Bearer invalid-token' },
        body: {},
        params: {},
        query: {},
        get: jest.fn(),
      } as unknown as RequestWithUser;

      await expect(controller.getLinks(unauthorizedRequest)).rejects.toThrow(
        new UnauthorizedException('User not authenticated'),
      );
      expect(mockUsersService.getLinks).not.toHaveBeenCalled();
    });
  });

  describe('updateLink', () => {
    const userId = 1;
    const linkId = '1';
    const jwtPayload: JwtPayload = {
      id: userId,
      username: 'testuser',
      email: 'test@kabir.com',
    };
    const mockRequest: RequestWithUser = {
      user: jwtPayload,
      headers: { authorization: 'Bearer valid-token' },
      body: {},
      params: {},
      query: {},
      get: jest.fn(),
    } as unknown as RequestWithUser;
    const updateLinkDto: UpdateLinkDto = {
      title: 'Updated Link',
      url: 'https://updated.com',
    };
    const updatedLink = {
      id: parseInt(linkId, 10),
      title: updateLinkDto.title,
      url: updateLinkDto.url,
      userId,
      createdAt: new Date(),
    };

    it('should update a link and return it', async () => {
      mockUsersService.updateLink.mockResolvedValue(updatedLink);

      const result = await controller.updateLink(
        mockRequest,
        linkId,
        updateLinkDto,
      );

      expect(result).toEqual(updatedLink);
      expect(mockUsersService.updateLink).toHaveBeenCalledWith(
        userId,
        parseInt(linkId, 10),
        updateLinkDto,
      );
    });

    it('should throw UnauthorizedException if no token is provided', async () => {
      const unauthorizedRequest: RequestWithUser = {
        user: null,
        headers: {},
        body: {},
        params: {},
        query: {},
        get: jest.fn(),
      } as unknown as RequestWithUser;

      await expect(
        controller.updateLink(unauthorizedRequest, linkId, updateLinkDto),
      ).rejects.toThrow(new UnauthorizedException('User not authenticated'));
      expect(mockUsersService.updateLink).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      const unauthorizedRequest: RequestWithUser = {
        user: null,
        headers: { authorization: 'Bearer invalid-token' },
        body: {},
        params: {},
        query: {},
        get: jest.fn(),
      } as unknown as RequestWithUser;

      await expect(
        controller.updateLink(unauthorizedRequest, linkId, updateLinkDto),
      ).rejects.toThrow(new UnauthorizedException('User not authenticated'));
      expect(mockUsersService.updateLink).not.toHaveBeenCalled();
    });

    it('should propagate NotFoundException from service', async () => {
      mockUsersService.updateLink.mockRejectedValue(
        new NotFoundException('Link not found or not authorized'),
      );

      await expect(
        controller.updateLink(mockRequest, linkId, updateLinkDto),
      ).rejects.toThrow(NotFoundException);
      expect(mockUsersService.updateLink).toHaveBeenCalledWith(
        userId,
        parseInt(linkId, 10),
        updateLinkDto,
      );
    });

    it('should throw BadRequestException for non-numeric link ID', async () => {
      const invalidId = 'abc';
      await expect(
        controller.updateLink(mockRequest, invalidId, updateLinkDto),
      ).rejects.toThrow(BadRequestException);
      expect(mockUsersService.updateLink).not.toHaveBeenCalled();
    });
  });

  describe('deleteLink', () => {
    const userId = 1;
    const linkId = '1';
    const jwtPayload: JwtPayload = {
      id: userId,
      username: 'testuser',
      email: 'test@kabir.com',
    };
    const mockRequest: RequestWithUser = {
      user: jwtPayload,
      headers: { authorization: 'Bearer valid-token' },
      body: {},
      params: {},
      query: {},
      get: jest.fn(),
    } as unknown as RequestWithUser;
    const deletedLink = {
      id: parseInt(linkId, 10),
      title: 'Link',
      url: 'https://kabir.com',
      userId,
      createdAt: new Date(),
    };

    it('should delete a link and return it', async () => {
      mockUsersService.deleteLink.mockResolvedValue(deletedLink);

      const result = await controller.deleteLink(mockRequest, linkId);

      expect(result).toEqual(deletedLink);
      expect(mockUsersService.deleteLink).toHaveBeenCalledWith(
        userId,
        parseInt(linkId, 10),
      );
    });

    it('should throw UnauthorizedException if no token is provided', async () => {
      const unauthorizedRequest: RequestWithUser = {
        user: null,
        headers: {},
        body: {},
        params: {},
        query: {},
        get: jest.fn(),
      } as unknown as RequestWithUser;

      await expect(
        controller.deleteLink(unauthorizedRequest, linkId),
      ).rejects.toThrow(new UnauthorizedException('User not authenticated'));
      expect(mockUsersService.deleteLink).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      const unauthorizedRequest: RequestWithUser = {
        user: null,
        headers: { authorization: 'Bearer invalid-token' },
        body: {},
        params: {},
        query: {},
        get: jest.fn(),
      } as unknown as RequestWithUser;

      await expect(
        controller.deleteLink(unauthorizedRequest, linkId),
      ).rejects.toThrow(new UnauthorizedException('User not authenticated'));
      expect(mockUsersService.deleteLink).not.toHaveBeenCalled();
    });

    it('should propagate NotFoundException from service', async () => {
      mockUsersService.deleteLink.mockRejectedValue(
        new NotFoundException('Link not found or not authorized'),
      );

      await expect(controller.deleteLink(mockRequest, linkId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUsersService.deleteLink).toHaveBeenCalledWith(
        userId,
        parseInt(linkId, 10),
      );
    });

    it('should throw BadRequestException for non-numeric link ID', async () => {
      const invalidId = 'abc';
      await expect(
        controller.deleteLink(mockRequest, invalidId),
      ).rejects.toThrow(BadRequestException);
      expect(mockUsersService.deleteLink).not.toHaveBeenCalled();
    });
  });

  describe('getPublicProfile', () => {
    const username = 'testuser';
    const publicProfile = {
      username,
      name: 'Test User',
      bio: 'Test Bio',
      links: [
        {
          id: 1,
          title: 'Link 1',
          url: 'https://kabir.com/1',
          createdAt: new Date(),
        },
      ],
    };

    it('should return public profile for a username', async () => {
      mockUsersService.getPublicProfile.mockResolvedValue(publicProfile);

      const result = await controller.getPublicProfile(username);

      expect(result).toEqual(publicProfile);
      expect(mockUsersService.getPublicProfile).toHaveBeenCalledWith(username);
    });

    it('should propagate NotFoundException from service', async () => {
      mockUsersService.getPublicProfile.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.getPublicProfile(username)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUsersService.getPublicProfile).toHaveBeenCalledWith(username);
    });
  });

  describe('getAllUsers', () => {
    const users = [
      { id: 1, username: 'testuser1', name: 'Test User 1' },
      { id: 2, username: 'testuser2', name: 'Test User 2' },
    ];

    it('should return all users', async () => {
      mockUsersService.getAllUsers.mockResolvedValue(users);

      const result = await controller.getAllUsers();

      expect(result).toEqual(users);
      expect(mockUsersService.getAllUsers).toHaveBeenCalled();
    });
  });

  describe('getMyProfile', () => {
    const userId = 1;
    const jwtPayload: JwtPayload = {
      id: userId,
      username: 'testuser',
      email: 'test@kabir.com',
    };
    const mockRequest: RequestWithUser = {
      user: jwtPayload,
      headers: { authorization: 'Bearer valid-token' },
      body: {},
      params: {},
      query: {},
      get: jest.fn(),
    } as unknown as RequestWithUser;
    const userProfile = {
      username: 'testuser',
      name: 'Test User',
      bio: 'Test Bio',
      links: [
        {
          id: 1,
          title: 'Link 1',
          url: 'https://kabir.com/1',
          createdAt: new Date(),
        },
      ],
    };

    it('should return authenticated user profile', async () => {
      mockUsersService.getUserProfileById.mockResolvedValue(userProfile);

      const result = await controller.getMyProfile(mockRequest);

      expect(result).toEqual(userProfile);
      expect(mockUsersService.getUserProfileById).toHaveBeenCalledWith(userId);
    });

    it('should throw UnauthorizedException if no token is provided', async () => {
      const unauthorizedRequest: RequestWithUser = {
        user: null,
        headers: {},
        body: {},
        params: {},
        query: {},
        get: jest.fn(),
      } as unknown as RequestWithUser;

      await expect(
        controller.getMyProfile(unauthorizedRequest),
      ).rejects.toThrow(new UnauthorizedException('User not authenticated'));
      expect(mockUsersService.getUserProfileById).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      const unauthorizedRequest: RequestWithUser = {
        user: null,
        headers: { authorization: 'Bearer invalid-token' },
        body: {},
        params: {},
        query: {},
        get: jest.fn(),
      } as unknown as RequestWithUser;

      await expect(
        controller.getMyProfile(unauthorizedRequest),
      ).rejects.toThrow(new UnauthorizedException('User not authenticated'));
      expect(mockUsersService.getUserProfileById).not.toHaveBeenCalled();
    });

    it('should propagate NotFoundException from service', async () => {
      mockUsersService.getUserProfileById.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.getMyProfile(mockRequest)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUsersService.getUserProfileById).toHaveBeenCalledWith(userId);
    });
  });
});
