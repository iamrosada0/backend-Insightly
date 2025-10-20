import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateLinkDto } from './dto/create-link.dto';
import { UpdateLinkDto } from './dto/update-link.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  updateProfile = async (
    userId: number,
    updateProfileDto: UpdateProfileDto,
  ) => {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const { name, bio } = updateProfileDto;

    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { name, bio },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          bio: true,
        },
      });
    } catch (error) {
      console.error('Prisma error:', error);
      throw new BadRequestException('Failed to update profile');
    }
  };

  createLink = async (userId: number, createLinkDto: CreateLinkDto) => {
    return this.prisma.link.create({
      data: {
        title: createLinkDto.title,
        url: createLinkDto.url,
        userId,
      },
    });
  };

  getLinks = async (userId: number) => {
    return this.prisma.link.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  };

  updateLink = async (
    userId: number,
    linkId: number,
    updateLinkDto: UpdateLinkDto,
  ) => {
    const link = await this.prisma.link.findUnique({ where: { id: linkId } });
    if (!link || link.userId !== userId) {
      throw new NotFoundException('Link not found or not authorized');
    }
    return this.prisma.link.update({
      where: { id: linkId },
      data: updateLinkDto,
    });
  };

  deleteLink = async (userId: number, linkId: number) => {
    const link = await this.prisma.link.findUnique({ where: { id: linkId } });
    if (!link || link.userId !== userId) {
      throw new NotFoundException('Link not found or not authorized');
    }
    return this.prisma.link.delete({ where: { id: linkId } });
  };

  getPublicProfile = async (username: string) => {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        username: true,
        name: true,
        bio: true,
        links: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            url: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  };

  findOne = async (userId: number) => {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
      },
    });
  };

  getAllUsers = async () => {
    return this.prisma.user.findMany({
      select: { id: true, username: true, name: true },
      orderBy: { name: 'asc' },
    });
  };

  getUserProfileById = async (userId: number) => {
    const user = await this.prisma.user.findUnique({
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
    if (!user) {
      throw new NotFoundException('user não encontrado');
    }
    return user;
  };
}
