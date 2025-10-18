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

  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    console.log('Updating profile for userId:', userId);
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
  }
  async createLink(userId: number, createLinkDto: CreateLinkDto) {
    return this.prisma.link.create({
      data: {
        title: createLinkDto.title,
        url: createLinkDto.url,
        userId,
      },
    });
  }

  async getLinks(userId: number) {
    return this.prisma.link.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateLink(
    userId: number,
    linkId: number,
    updateLinkDto: UpdateLinkDto,
  ) {
    const link = await this.prisma.link.findUnique({ where: { id: linkId } });
    if (!link || link.userId !== userId) {
      throw new NotFoundException('Link not found or not authorized');
    }
    return this.prisma.link.update({
      where: { id: linkId },
      data: updateLinkDto,
    });
  }

  async deleteLink(userId: number, linkId: number) {
    const link = await this.prisma.link.findUnique({ where: { id: linkId } });
    if (!link || link.userId !== userId) {
      throw new NotFoundException('Link not found or not authorized');
    }
    return this.prisma.link.delete({ where: { id: linkId } });
  }

  async getPublicProfile(username: string) {
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
  }

  async findOne(userId: number) {
    console.log('Finding user with ID:', userId);
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
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: { id: true, username: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  async getUserProfileById(userId: number) {
    console.log('Fetching profile for userId:', userId);
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
  }
}
