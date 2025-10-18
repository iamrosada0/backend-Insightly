import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateLinkDto } from './dto/create-link.dto';
import { UpdateLinkDto } from './dto/update-link.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    const { name, bio } = updateProfileDto;
    return this.prisma.user.update({
      where: { id: userId },
      data: { name, bio },
      select: { id: true, email: true, username: true, name: true, bio: true },
    });
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
        links: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findOne(userId: number) {
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
}
